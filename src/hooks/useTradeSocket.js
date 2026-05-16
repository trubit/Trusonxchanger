import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import {
  checkTradeBackendAvailability,
  getTradeWebSocketUrl,
} from "../services/tradeService";
import { useSocketStore } from "../store/socketStore";

const HEARTBEAT_MS = 18_000;
const MAX_BACKOFF_MS = 20_000;
const BASE_BACKOFF_MS = 1200;

export const useTradeSocket = ({ symbol, isAuthenticated }) => {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const setStatus = useSocketStore((state) => state.setStatus);
  const setActiveSymbol = useSocketStore((state) => state.setActiveSymbol);
  const markMessage = useSocketStore((state) => state.markMessage);
  const incrementReconnect = useSocketStore((state) => state.incrementReconnect);
  const resetReconnect = useSocketStore((state) => state.resetReconnect);

  useEffect(() => {
    if (!symbol) return;
    let closedByEffect = false;
    let reconnectAttempts = 0;
    setActiveSymbol(symbol);

    const applySnapshot = (snapshot) => {
      const targetKey = isAuthenticated
        ? queryKeys.trade.myMarketState(symbol)
        : queryKeys.trade.marketState(symbol);
      queryClient.setQueryData(targetKey, snapshot);
      if (snapshot?.pairs) {
        queryClient.setQueryData(queryKeys.trade.pairs, snapshot.pairs);
      }
    };

    const applyTicker = (ticker) => {
      const keys = [
        queryKeys.trade.marketState(symbol),
        queryKeys.trade.myMarketState(symbol),
      ];

      keys.forEach((key) => {
        queryClient.setQueryData(key, (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ticker: { ...prev.ticker, ...ticker },
          };
        });
      });
    };

    const scheduleReconnect = () => {
      reconnectAttempts += 1;
      const delay = Math.min(
        BASE_BACKOFF_MS * 2 ** Math.max(0, reconnectAttempts - 1),
        MAX_BACKOFF_MS,
      );
      setStatus("reconnecting");
      incrementReconnect();
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    const clearTimers = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
      }
    };

    const connect = async () => {
      clearTimers();
      setStatus("connecting");
      const backendUp = await checkTradeBackendAvailability();
      if (!backendUp || closedByEffect) {
        setStatus("offline");
        return;
      }

      const socket = new WebSocket(getTradeWebSocketUrl(symbol));
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts = 0;
        setStatus("connected");
        resetReconnect();
        socket.send(JSON.stringify({ type: "subscribe", symbol }));
        heartbeatTimerRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping", ts: Date.now() }));
          }
        }, HEARTBEAT_MS);
      };

      socket.onmessage = (event) => {
        markMessage();
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === "snapshot" && payload?.data) {
            applySnapshot(payload.data);
            return;
          }
          if (payload?.type === "ticker" && payload?.data) {
            applyTicker(payload.data);
            return;
          }
          if (payload?.type === "order" || payload?.type === "trade") {
            queryClient.invalidateQueries({ queryKey: queryKeys.trade.marketState(symbol) });
            queryClient.invalidateQueries({ queryKey: queryKeys.trade.myMarketState(symbol) });
          }
        } catch {
          // Ignore malformed payloads.
        }
      };

      socket.onclose = () => {
        if (closedByEffect) return;
        clearTimers();
        scheduleReconnect();
      };

      socket.onerror = () => {
        if (closedByEffect) return;
        setStatus("error");
        socket.close();
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      clearTimers();
      if (socketRef.current) {
        socketRef.current.close();
      }
      setStatus("closed");
    };
  }, [
    incrementReconnect,
    isAuthenticated,
    markMessage,
    queryClient,
    resetReconnect,
    setActiveSymbol,
    setStatus,
    symbol,
  ]);
};

