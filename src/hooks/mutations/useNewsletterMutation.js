import { useMutation } from "@tanstack/react-query";
import { subscribeToNewsletter } from "../../services/newsletterService";

export const useNewsletterMutation = () =>
  useMutation({
    mutationFn: subscribeToNewsletter,
  });

