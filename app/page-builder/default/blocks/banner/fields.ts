import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, toneField, alignField } from "../../../../utils/pb-fields";

// Title band for inner pages (About, Pricing, Contact…).
export default blockFields({
  ...headingFields({ title: "Page title" }),
  breadcrumb: createField.text({ label: "Breadcrumb", description: 'Current page name, e.g. "About". Blank hides it.', default: "" }),
  homeLabel: createField.text({ label: "Home link text", description: "First breadcrumb item, links to the home page.", default: "Home", conditions: (d) => !!d.breadcrumb }),
  align: alignField("center"),
  background: createField.select(
    [
      { label: "Accent glow", value: "glow", id: "bb-glow" },
      { label: "Grid lines", value: "grid", id: "bb-grid" },
      { label: "Photo", value: "image", id: "bb-image" },
      { label: "Plain", value: "plain", id: "bb-plain" },
    ],
    { label: "Backdrop", default: "glow", group: "Style" }
  ),
  backgroundImage: createField.image({ label: "Backdrop photo", conditions: (d) => d.background === "image", group: "Style" }),
  tone: toneField("light"),
});
