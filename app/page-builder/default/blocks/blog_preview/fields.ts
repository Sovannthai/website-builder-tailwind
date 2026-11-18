import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, buttonFields, toneField, spaceField, apiSourceFields } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields({ eyebrow: "Blog", title: "Latest from the *blog*" }),
  posts: createField.repeater(
    {
      image: createField.image({ label: "Cover image", description: "Blank shows an accent placeholder." }),
      title: createField.text({ label: "Title", default: "Post title" }),
      excerpt: createField.textarea({ label: "Excerpt", rows: 2, default: "" }),
      category: createField.text({ label: "Category", default: "" }),
      date: createField.text({ label: "Date", default: "" }),
      link: createField.text({ label: "Link", default: "#" }),
    },
    { label: "Posts", repeaterFieldLabel: "title", default: [] }
  ),
  ...buttonFields("button", "All posts button", { label: "View all posts", link: "#" }),
  tone: toneField("light"),
  space: spaceField("md"),
  ...apiSourceFields(
    [
      { label: "Title", value: "title" },
      { label: "Excerpt", value: "description" },
      { label: "Cover image", value: "image" },
      { label: "Category", value: "category" },
      { label: "Date", value: "date" },
      { label: "Link", value: "path" },
    ],
    "3"
  ),
});
