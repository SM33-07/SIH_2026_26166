
# MODEL STATUS

## TMC-2

The bundled TMC-2 checkpoint is:

`models/tmc2/tmc2_loftr_available.pt`

It is the available TMC-2 LoFTR checkpoint from the Kaggle input
dataset.

Checkpoint metadata:

- Epoch: 3
- Global step: 5625
- Training loss: approximately 0.689374
- Architecture: 11,561,456 parameters
- Coarse transformer: 8 layers
- Fine transformer: 2 layers

IMPORTANT:

The later Step5D checkpoint:

`tmc2_loftr_step05d_best.pt`

was created in a previous Kaggle working session and is NOT present
in the current filesystem.

Therefore the bundled TMC-2 checkpoint must NOT be described in the
VS Code application as the Step5D checkpoint.

The recorded Step5D validation result is preserved separately as a
historical result.

## OHRC

Bundled model:

`models/ohrc/ohrc_resnet18_best.pth`

This is the trained grayscale ResNet18-style embedding model used
for OHRC representation.

## IIRS

Bundled files:

- `models/iirs/loftr_coarse_best.pt`
- `models/iirs/loftr_fine_best.pt`

These belong to the IIRS training assets.

The current IIRS operational product used by the geographic mapper is
the real IIRS proxy imagery plus approximate pixel-to-lunar
geolocation.

## Geographic common-point system

Current master geographic catalog:

- 1,514 strong three-sensor common points
- 500 prepared judge demonstration points

These are geographic correspondence points, not independently
human-annotated visual ground truth.

## Important reporting rule

Do not claim that the 1,514 common points or the recorded 99%+
validation numbers represent independent real-world visual
correspondence accuracy.

The consistency score is a geographic consistency score, not a
calibrated probability.
