import mongoose from "mongoose";

// Blog content stored in MongoDB.
const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    link: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
    tag: { type: String, default: "" },
    date: { type: String, default: "" },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BlogSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

const Blog = mongoose.model("Blog", BlogSchema);

export default Blog; 

