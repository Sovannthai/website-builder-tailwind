import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, toneField, spaceField, alignField, apiSourceFields } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields({ eyebrow: "Features", title: "Everything you need to *grow*" }),
  items: createField.repeater(
    {
      icon: createField.text({ label: "Icon", description: 'Material Design Icon name, e.g. "rocket-launch-outline".', default: "star-four-points-outline" }),
      image: createField.image({ label: "Image", description: "Optional. Shown instead of the icon." }),
      title: createField.text({ label: "Title", default: "Feature" }),
      description: createField.textarea({ label: "Description", rows: 2, default: "" }),
      link: createField.text({ label: "Link", description: 'Optional "Learn more" link.', default: "" }),
    },
    { label: "Items", repeaterFieldLabel: "title", default: [] }
  ),
  linkLabel: createField.text({ label: "Item link text", description: "Shown on items that have a link.", default: "Learn more" }),
  layout: createField.select(
    [
      { label: "Cards", value: "cards", id: "fl-cards" },
      { label: "Bento grid", value: "bento", id: "fl-bento" },
      { label: "Simple list", value: "list", id: "fl-list" },
    ],
    { label: "Layout", default: "cards", group: "Style" }
  ),
  columns: createField.select(
    [
      { label: "2", value: "2", id: "fc-2" },
      { label: "3", value: "3", id: "fc-3" },
      { label: "4", value: "4", id: "fc-4" },
    ],
    { label: "Columns", default: "3", group: "Style", conditions: (d) => d.layout === "cards" || !d.layout }
  ),
  align: alignField("center"),
  tone: toneField("light"),
  space: spaceField("md"),
  anchor: createField.text({ label: "Section id", description: 'Lets links like "#features" jump here.', default: "", group: "Style" }),
  ...apiSourceFields([
    { label: "Title", value: "title" },
    { label: "Description", value: "description" },
    { label: "Image", value: "image" },
    { label: "Link", value: "path" },
  ]),
});
