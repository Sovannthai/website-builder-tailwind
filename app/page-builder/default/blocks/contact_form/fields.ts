import { createField } from "vue-wswg-editor";
import { blockFields, headingFields, toneField, spaceField } from "../../../../utils/pb-fields";

export default blockFields({
  ...headingFields({ eyebrow: "Contact", title: "Get in *touch*" }),
  details: createField.repeater(
    {
      icon: createField.text({ label: "Icon", description: 'e.g. "email-outline", "phone-outline", "map-marker-outline".', default: "email-outline" }),
      label: createField.text({ label: "Label", default: "Email" }),
      value: createField.text({ label: "Value", default: "hello@example.com" }),
      link: createField.text({ label: "Link", description: 'e.g. "mailto:hello@example.com". Optional.', default: "" }),
    },
    { label: "Contact details", repeaterFieldLabel: "label", default: [] }
  ),
  nameLabel: createField.text({ label: "Name label", default: "Name", group: "Form" }),
  emailLabel: createField.text({ label: "Email label", default: "Email", group: "Form" }),
  showPhone: createField.boolean({ label: "Ask for a phone number", default: false, group: "Form" }),
  phoneLabel: createField.text({ label: "Phone label", default: "Phone", group: "Form", conditions: (d) => d.showPhone === true || d.showPhone === "true" }),
  topics: createField.textarea({ label: "Topic choices", description: "One per line. Blank hides the topic picker.", rows: 3, default: "", group: "Form" }),
  topicLabel: createField.text({ label: "Topic label", default: "Topic", group: "Form", conditions: (d) => !!d.topics }),
  messageLabel: createField.text({ label: "Message label", default: "Message", group: "Form" }),
  submitLabel: createField.text({ label: "Button text", default: "Send message", group: "Form" }),
  successMessage: createField.text({ label: "Thank-you message", default: "Thanks! We'll get back to you soon.", group: "Form" }),
  errorMessage: createField.text({ label: "Error message", description: "Shown if sending fails.", default: "Something went wrong. Please try again.", group: "Form" }),
  endpoint: createField.text({
    label: "Send submissions to",
    description: 'Collection key ("messages"), path or full URL that accepts a JSON POST. Blank: the form only shows the thank-you message.',
    default: "",
    group: "Data",
  }),
  tone: toneField("light"),
  space: spaceField("md"),
  anchor: createField.text({ label: "Section id", default: "contact", group: "Style" }),
});
