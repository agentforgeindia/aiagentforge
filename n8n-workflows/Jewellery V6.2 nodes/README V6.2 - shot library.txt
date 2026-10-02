JEWELLERY V6.2 — Reference-style shot library (1000+ unique outputs)
=====================================================================
"AF Updates refers\Jewellery Agent" ke 11 folders (≈98 photos) dekh ke har jewellery type ki
shot library banayi hai. Har generation ko generation_id se apna alag combination milta hai:
  Crop & Pose  +  Outfit  +  Hair  +  Light  +  Backdrop colour   (model shots)
  Arrangement  +  Props/Setting  +  Backdrop  +  Light            (No Model shots)
Test: har type ke 1000 runs me ~980-990 alag combinations.

Type-wise (references se):
  Earrings  : ear profile close-up, leaves frame, light beam, sun-disc, brass tray / branch / driftwood (no model)
  Necklace / Choker / Chain / Mangalsutra : chin-up eyes closed, hand on collarbone, veil fabric, window beam, velvet/travertine bust
  Pendant   : lips-to-chest crop, chain on bark wood / bust
  Set       : bust portrait, chin-on-fist table pose, dupatta, carved chair + vase, bust + earring stand
  Ring      : hand on pampas, mirror water, hand to camera, fingertips at lips, driftwood / plaster pedestal / hand mannequin
  Bangles / Bracelet / Kada : arm in light beam, wrists crossed at face, henna hands, T-bar stand, marble cube, carved box + diya
  Tikka     : chin-on-arms sofa, veiled lower face, sleek centre parting, carved box / velvet plate
  Nose Pin  : extreme face close-up, veil, saree pallu portrait
  Anklet    : lehenga hem + heels, crossed feet with alta, marble block
  Male      : kada/ring/chain/brooch poses with kurta, bandhgala, sherwani, open-collar shirt

User ki selection hamesha jeetegi:
  - Pose "Auto" nahi hai -> wahi pose use hoga (library pose skip)
  - Studio set / Outdoor theme / Upload Your Scene / White BG -> wahi background, library colour skip
  - Upload Your Model -> hair library skip (face lock wahi rahega)
  - Necklace/Set/Choker/Pendant -> sirf open-neckline outfits (V6.1 size lock ke saath match)

Kaunse nodes badle (V6.1 ke upar):
  2 - Single Build Prompt Context1  (Code)      -> poora code paste
  3 - Bulk Build Prompt Context1    (Code)      -> poora code paste
  4 - Single OpenAI Prompt Builder1 (JSON body) -> Body me poora text paste
  5 - Bulk OpenAI Prompt Builder1   (JSON body) -> Body me poora text paste
  6 - Single Parse Prompt JSON1     (Code)      -> poora code paste (V6.1 size lock bhi isi me hai)
  7 - Bulk Parse Prompt JSON1       (Code)      -> poora code paste
  Save -> Publish.  (Headers / FAL key mat chhedna.)

Poora import ("Jewellery Ai Studio - V6.2.json") bhi kar sakte ho, par usme FAL key purani hai —
import ke baad 6 FAL nodes me nayi key daalni padegi. Isliye copy-paste better hai.
