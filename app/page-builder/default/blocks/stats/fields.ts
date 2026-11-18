import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, toneField, spaceField, alignField, apiSourceFields } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields(),
  items: createField.repeater(
    {
      value: createField.text({ label: "Number", default: "99%" }),
      label: createField.text({ label: "Label", default: "Happy customers" }),
      description: createField.text({ label: "Detail", default: "" }),
    },
    { label: "Stats", repeaterFieldLabel: "label", default: [] }
  ),
  variant: createField.select(
    [
      { label: "Divided row", value: "divided", id: "ss-divided" },
      { label: "Cards", value: "cards", id: "ss-cards" },
    ],
    { label: "Style", default: "divided", group: "Style" }
  ),
  align: alignField("center"),
  tone: toneField("light"),
  space: spaceField("md"),
  ...apiSourceFields(
    [
      { label: "Number", value: "value" },
      { label: "Label", value: "title" },
      { label: "Detail", value: "description" },
    ],
    "4"
  ),
});
