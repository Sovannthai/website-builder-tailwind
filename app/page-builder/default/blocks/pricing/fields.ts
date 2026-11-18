import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, toneField, spaceField } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields({ eyebrow: "Pricing", title: "Simple, *transparent* pricing" }),
  plans: createField.repeater(
    {
      name: createField.text({ label: "Plan name", default: "Starter" }),
      price: createField.text({ label: "Price", default: "$19" }),
      period: createField.text({ label: "Period", description: 'e.g. "/month". Blank hides it.', default: "/month" }),
      description: createField.text({ label: "Short description", default: "" }),
      features: createField.textarea({ label: "Features", description: "One per line.", rows: 5, default: "" }),
      ctaLabel: createField.text({ label: "Button text", default: "Get started" }),
      ctaLink: createField.text({ label: "Button link", default: "#" }),
      highlighted: createField.boolean({ label: "Highlight this plan", default: false }),
      badge: createField.text({ label: "Badge", description: 'e.g. "Most popular". Blank hides it.', default: "" }),
    },
    { label: "Plans", repeaterFieldLabel: "name", default: [] }
  ),
  note: createField.text({ label: "Note under the plans", default: "" }),
  tone: toneField("light"),
  space: spaceField("md"),
  anchor: createField.text({ label: "Section id", description: 'Lets links like "#pricing" jump here.', default: "pricing", group: "Style" }),
});
