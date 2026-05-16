import { useMemo, useState } from "react";
import {
  useCreateBlogMutation,
  useDeleteBlogMutation,
  useUpdateBlogMutation,
} from "./mutations/useBlogMutations";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  image: "",
  imageAlt: "",
  tag: "",
};

export const MAX_IMAGE_SIZE_MB = 3;

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
  const [saveError, setSaveError] = useState("");

  const imageUrlValue = useMemo(
    () =>
      formData.image && formData.image.startsWith("data:")
        ? ""
        : formData.image,
    [formData.image]
  );

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }

    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > MAX_IMAGE_SIZE_MB) {
      setUploadError(
        `Image is too large. Max size is ${MAX_IMAGE_SIZE_MB} MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        image: reader.result,
        imageAlt: prev.imageAlt || file.name,
      }));
      setUploadError("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError("");

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: formData.date.trim(),
      image: formData.image.trim(),
      imageAlt: formData.imageAlt.trim(),
      tag: formData.tag.trim(),
    };

    if (!payload.title || !payload.description) {
      setSaveError("Title and description are required.");
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
      setSaveError(err.message || "Unable to save blog post.");
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
      setSaveError(err.message || "Unable to delete blog post.");
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
