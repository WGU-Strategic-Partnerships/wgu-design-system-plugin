# WGU Components: Forms and Inputs

## Form principles

- **Clarity.** Labels above inputs. No placeholder-as-label patterns.
- **Forgiveness.** Validation is helpful, not punitive. Tell the user what to do, not just what is wrong.
- **Brevity.** Only ask for what you need. Long forms reduce conversion.
- **Accessibility.** Always associate labels with inputs, always provide focus styles, always indicate required fields with the word "required" (not just an asterisk).

## Input anatomy

```
Label
[ Input field                        ]
Help text or error message
```

- **Label** above the input. WGU Blue text. 14 to 16px. Medium weight.
- **Input** 44px tall by default (matches button default height). 12px internal padding.
- **Help text** in `--fg-3` (grey). 14px. Optional.
- **Error text** in red (`#C13434` or system semantic red). 14px.

## Input states

| State | Visual |
| --- | --- |
| **Default** | White background, `--border-thin` (1px Blue 12% opacity), WGU Blue text |
| **Focus** | Border becomes 2px Medium Blue. Add `--shadow-focus` ring |
| **Filled** | Same as default, with WGU Blue text content |
| **Error** | 2px red border. Red help text below |
| **Disabled** | Light Grey background, Grey text, no border change |
| **Read-only** | Light Grey background, WGU Blue text, no border |

## Sizing

- **Default.** 44px height, 16px type.
- **Compact.** 36px height, 14px type. For dense forms only.
- **Large.** 56px height, 18px type. For hero search inputs and prominent fields.

## Common input types

- **Text input.** Single line. Use for short answers (name, email, ZIP).
- **Textarea.** Multi-line. Use for messages, free-form input. Min height 96px.
- **Select.** Dropdown. Use only when 5+ choices and no good radio alternative.
- **Radio.** Single choice from a small set (2 to 5 options).
- **Checkbox.** Multi-choice or boolean.
- **Date picker.** Calendar UI. Always include keyboard input fallback.
- **Search.** With a leading Lucide `search` icon.

## Required and optional

Mark **required** fields explicitly. Either:

- Add the word "required" to the label, or
- Mark optional fields with "(optional)" if most fields are required.

Avoid relying on a red asterisk alone. Screen readers handle the word "required" more reliably.

## Validation

- **Inline.** Validate on blur, not on every keystroke.
- **Specific.** "Enter a valid email address" beats "Invalid input".
- **Constructive.** Tell the user what to do next. "Password must be at least 8 characters."
- **Field-level.** Show errors next to the field, not only at the top of the form.
- **Form-level summary.** On submit, if there are multiple errors, also surface a summary at the top of the form with anchor links to each problem field.

## Help text

- Place below the input.
- Limit to one short sentence.
- Use for format hints ("MM/DD/YYYY") or expectations ("We will email you a confirmation").
- Do not repeat the label content.

## Focus ring

The focus ring uses `--shadow-focus`. Always visible on `:focus-visible`. Do not disable.

```css
.input:focus-visible {
  outline: none;
  border-color: var(--wgu-medium-blue);
  box-shadow: var(--shadow-focus);
}
```

## Buttons inside forms

- **Submit.** Primary button, full-width on mobile, right-aligned on desktop.
- **Cancel or back.** Secondary button to the left of submit on desktop, above on mobile.
- **Avoid disabled submit buttons by default.** Allow submission and surface validation errors. Disabled submit is unkind UX.

## What not to do

- Don't use placeholder text as the only label.
- Don't validate on every keystroke. Wait for blur.
- Don't surface every form error in a single red toast. Field-level errors are more useful.
- Don't reduce the focus ring or hide the border on focus.
- Don't ask for information you do not need.
- Don't use Lime Green as an input border or focus color.
