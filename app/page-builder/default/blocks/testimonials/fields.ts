import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, toneField, spaceField, alignField, apiSourceFields } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields({ title: "Loved by *teams* everywhere" }),
  items: createField.repeater(
    {
      quote: createField.textarea({ label: "Quote", rows: 3, default: "" }),
      name: createField.text({ label: "Name", default: "Customer name" }),
      role: createField.text({ label: "Role / company", default: "" }),
      avatar: createField.image({ label: "Photo", description: "Blank shows initials." }),
    },
    { label: "Testimonials", repeaterFieldLabel: "name", default: [] }
  ),
  layout: createField.select(
    [
      { label: "Card wall", value: "grid", id: "tl-grid" },
      { label: "One big quote", value: "spotlight", id: "tl-spotlight" },
    ],
    { label: "Layout", default: "grid", group: "Style" }
  ),
  showRating: createField.boolean({ label: "Show 5-star rating", default: false, group: "Style" }),
  align: alignField("center"),
  tone: toneField("light"),
  space: spaceField("md"),
  ...apiSourceFields([
    { label: "Quote", value: "message" },
    { label: "Name", value: "title" },
    { label: "Role", value: "role" },
    { label: "Photo", value: "image" },
  ]),
});
