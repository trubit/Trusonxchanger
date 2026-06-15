import { useState } from "react";
import {
  useCreateBlogMutation,
  useDeleteBlogMutation,
  useUpdateBlogMutation,
} from "./mutations/useBlogMutations";
import { uploadBlogImage } from "../services/api/blogs";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  image: "",
  imageAlt: "",
  tag: "",
};

export const MAX_IMAGE_SIZE_MB = 3;

const toFriendlyBlogError = (err, fallback) => {
  const status = err?.status;
  if (status === 401) {
    return "Please log in again to continue.";
  }
  if (status === 403) {
    return "Your account does not currently have permission for this action.";
  }
  return err?.message || fallback;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read the selected image."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(new Error("Unable to read the selected image."));
    };
    reader.readAsDataURL(file);
  });

// Hook for managing the blog update form state + image uploads.
export const useBlogUpdateForm = ({
  posts,
  visiblePosts,
  activePost,
  onActivatePost,
  onSaveSuccess,
}) => {
  const createMutation = useCreateBlogMutation();
  const updateMutation = useUpdateBlogMutation();
  const deleteMutation = useDeleteBlogMutation();
  const [editingId, setEditingId] = useState("new");
  const [formData, setFormData] = useState(emptyForm);
  const [uploadError, setUploadError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveError, setSaveError] = useState("");

  const imageUrlValue =
    formData.image && formData.image.startsWith("data:")
      ? ""
      : formData.image;

  const handleSelectChange = (event) => {
    const value = event.target.value;
    setEditingId(value);
    setUploadError("");
    setSaveError("");

    if (value === "new") {
      setFormData(emptyForm);
      return;
    }

    const selected = posts.find((post) => post.id === value);
    if (!selected) {
      setFormData(emptyForm);
      return;
    }

    const visibleIndex = visiblePosts.findIndex((post) => post.id === value);
    if (visibleIndex >= 0) {
      onActivatePost?.(visibleIndex);
    }

    setFormData({
      title: selected.title ?? "",
      description: selected.description ?? "",
      date: selected.date ?? "",
      image: selected.image ?? "",
      imageAlt: selected.imageAlt ?? "",
      tag: selected.tag ?? "",
    });
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    if (name === "image") {
      setUploadError("");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (event) => {
    const input = event.target;
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      input.value = "";
      return;
    }

    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > MAX_IMAGE_SIZE_MB) {
      setUploadError(
        `Image is too large. Max size is ${MAX_IMAGE_SIZE_MB} MB.`
      );
      input.value = "";
      return;
    }

    setUploadingImage(true);
    setUploadError("");
    try {
      const payload = await uploadBlogImage(file);
      const imageValue = payload?.url || payload?.path || "";
      if (!imageValue) {
        setUploadError("Upload failed. Please try again.");
        return;
      }
      setFormData((prev) => ({ ...prev, image: imageValue }));
    } catch (err) {
      const status = err?.status;
      const message = err?.message || "";
      const uploadRouteMissing =
        status === 404 || /route not found/i.test(message);

      if (uploadRouteMissing) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          setFormData((prev) => ({ ...prev, image: dataUrl }));
          setUploadError(
            "Upload endpoint not available on this server yet. Using local image data for now."
          );
        } catch (fallbackErr) {
          setUploadError(fallbackErr.message || "Upload failed. Please try again.");
        }
      } else {
        setUploadError(toFriendlyBlogError(err, "Upload failed. Please try again."));
      }
    } finally {
      setUploadingImage(false);
      input.value = "";
    }
  };

  const handleRemoveImage = () => {
    setUploadError("");
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError("");

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: formData.date.trim(),
      image: formData.image,
      imageAlt: formData.imageAlt.trim(),
      tag: formData.tag.trim(),
    };

    if (!payload.title || !payload.description) {
      setSaveError("Title and description are required.");
      return;
    }

    if (uploadingImage) {
      setSaveError("Please wait for the image upload to finish.");
      return;
    }

    try {
      if (editingId === "new") {
        const data = await createMutation.mutateAsync(payload);
        const newPost = data?.post;
        if (newPost) {
          setEditingId("new");
          setFormData(emptyForm);
          onSaveSuccess?.();
        }
      } else {
        const data = await updateMutation.mutateAsync({ id: editingId, payload });
        const updated = data?.post;
        if (updated) {
          onSaveSuccess?.();
        }
      }
    } catch (err) {
      setSaveError(toFriendlyBlogError(err, "Unable to save blog post."));
    }
  };

  const handleDelete = async () => {
    if (editingId === "new") {
      setSaveError("Select a post to delete.");
      return;
    }

    const confirmed = window.confirm("Delete this blog post? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    setSaveError("");
    try {
      await deleteMutation.mutateAsync(editingId);
      setEditingId("new");
      setFormData(emptyForm);
      onSaveSuccess?.();
    } catch (err) {
      setSaveError(toFriendlyBlogError(err, "Unable to delete blog post."));
    }
  };

  const useLatestPost = () => {
    if (!activePost) {
      return;
    }

    setEditingId(activePost.id);
    setUploadError("");
    setSaveError("");
    setFormData({
      title: activePost.title ?? "",
      description: activePost.description ?? "",
      date: activePost.date ?? "",
      image: activePost.image ?? "",
      imageAlt: activePost.imageAlt ?? "",
      tag: activePost.tag ?? "",
    });
  };

  return {
    editingId,
    formData,
    uploadError,
    saveError,
    saving: createMutation.isPending || updateMutation.isPending,
    uploadingImage,
    deleting: deleteMutation.isPending,
    imageUrlValue,
    handleSelectChange,
    handleFieldChange,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
    handleDelete,
    useLatestPost,
  };
};
