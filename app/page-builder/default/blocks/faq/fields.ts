import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, buttonFields, toneField, spaceField } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields({ eyebrow: "FAQ", title: "Questions? *Answers.*" }),
  items: createField.repeater(
    {
      question: createField.text({ label: "Question", default: "Your question?" }),
      answer: createField.textarea({ label: "Answer", rows: 3, default: "" }),
    },
    { label: "Questions", repeaterFieldLabel: "question", default: [] }
  ),
  ...buttonFields("contact", "Contact button"),
  layout: createField.select(
    [
      { label: "Heading left, questions right", value: "split", id: "ql-split" },
      { label: "Centred", value: "centered", id: "ql-centered" },
    ],
    { label: "Layout", default: "split", group: "Style" }
  ),
  openFirst: createField.boolean({ label: "Open the first answer", default: true, group: "Style" }),
  tone: toneField("light"),
  space: spaceField("md"),
  anchor: createField.text({ label: "Section id", default: "faq", group: "Style" }),
});
