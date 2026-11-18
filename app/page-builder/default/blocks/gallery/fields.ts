import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, toneField, spaceField, alignField, apiSourceFields } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields(),
  images: createField.repeater(
    {
      image: createField.image({ label: "Image" }),
      caption: createField.text({ label: "Caption", description: "Shown on hover. Optional.", default: "" }),
    },
    { label: "Images", repeaterFieldLabel: "caption", default: [] }
  ),
  layout: createField.select(
    [
      { label: "Feature grid (first image big)", value: "grid", id: "gl-grid" },
      { label: "Masonry", value: "masonry", id: "gl-masonry" },
    ],
    { label: "Layout", default: "grid", group: "Style" }
  ),
  align: alignField("center"),
  tone: toneField("light"),
  space: spaceField("md"),
  ...apiSourceFields(
    [
      { label: "Image", value: "image" },
      { label: "Caption", value: "title" },
    ],
    "9"
  ),
});
