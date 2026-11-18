import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, buttonFields, toneField, spaceField, alignField } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields({ title: "Ready to get *started*?" }),
  ...buttonFields("primary", "Main button", { label: "Get started", link: "#" }),
  ...buttonFields("secondary", "Second button"),
  variant: createField.select(
    [
      { label: "Rounded card", value: "card", id: "cs-card" },
      { label: "Full-width band", value: "band", id: "cs-band" },
    ],
    { label: "Style", default: "card", group: "Style" }
  ),
  align: alignField("center"),
  tone: toneField("brand"),
  space: spaceField("md"),
});
