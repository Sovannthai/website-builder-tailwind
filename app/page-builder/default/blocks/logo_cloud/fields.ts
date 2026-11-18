import { createField } from "vue-wswg-editor";
import { blockFields, toneField, spaceField } from "../../../../utils/pb-fields";

export default blockFields({
  title: createField.text({ label: "Caption", default: "Trusted by teams at" }),
  logos: createField.repeater(
    {
      name: createField.text({ label: "Name", default: "Company" }),
      image: createField.image({ label: "Logo image", description: "Blank shows the name as a wordmark." }),
      icon: createField.text({ label: "Icon (wordmark only)", description: 'Material Design Icon name, e.g. "hexagon-outline".', default: "" }),
    },
    { label: "Logos", repeaterFieldLabel: "name", default: [] }
  ),
  tone: toneField("light"),
  space: spaceField("sm"),
});
