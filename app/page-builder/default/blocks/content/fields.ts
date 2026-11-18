import { createField } from "vue-wswg-editor";
import { blockFields, mockupStatsField, buttonFields, toneField, spaceField } from "../../../../utils/pb-fields";

export default blockFields({
  eyebrow: createField.text({ label: "Eyebrow", default: "" }),
  title: createField.text({
    label: "Title",
    description: "Wrap words in *asterisks* to highlight them.",
    default: "Tell your *story* here",
  }),
  body: createField.textarea({ label: "Text", rows: 4, default: "" }),
  bullets: createField.textarea({ label: "Checklist", description: "One point per line. Blank hides the list.", rows: 4, default: "" }),
  ...buttonFields("button", "Button"),
  ...buttonFields("link", "Text link"),

  visual: createField.select(
    [
      { label: "Image", value: "image", id: "cv-image" },
      { label: "App screenshot mockup", value: "mockup", id: "cv-mockup" },
    ],
    { label: "Visual", default: "image", group: "Style" }
  ),
  image: createField.image({ label: "Image", description: "Blank shows an accent placeholder.", conditions: (d) => d.visual !== "mockup", group: "Style" }),
  mockupStats: mockupStatsField(),
  aspect: createField.select(
    [
      { label: "Landscape 4:3", value: "4/3", id: "ca-43" },
      { label: "Square", value: "1/1", id: "ca-11" },
      { label: "Portrait 3:4", value: "3/4", id: "ca-34" },
      { label: "Wide 16:9", value: "16/9", id: "ca-169" },
    ],
    { label: "Image shape", default: "4/3", group: "Style", conditions: (d) => d.visual !== "mockup" }
  ),
  mediaSide: createField.select(
    [
      { label: "Right", value: "right", id: "cm-right" },
      { label: "Left", value: "left", id: "cm-left" },
    ],
    { label: "Visual on the", default: "right", group: "Style" }
  ),
  tone: toneField("light"),
  space: spaceField("md"),
  anchor: createField.text({ label: "Section id", description: 'Lets links like "#about" jump here.', default: "", group: "Style" }),
});
