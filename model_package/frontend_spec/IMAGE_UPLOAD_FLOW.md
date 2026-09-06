# IMAGE UPLOAD FLOW

## 1. Three Upload Areas

Create:

- OHRC
- TMC-2
- IIRS

Each should provide:

- drag/drop
- browse button
- preview
- remove button

## 2. Validation

Frontend should check:

- file exists
- supported format
- reasonable file size

Backend performs final validation.

Frontend validation is not a security boundary.

## 3. Preview

Show the selected image before submission.

## 4. Submit

Button:

Check Correspondence

Disable it until all required images exist.

## 5. Processing

Show:

Analyzing...

Optionally show processing stages.

## 6. Result

Show the final decision first.

Then show:

- images
- map
- evidence
