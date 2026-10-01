# Editorial frontend theme

Branch: `feature/editorial-frontend-theme`.

The shared darker paper-and-charcoal palette, serif headings, centered masthead,
simple navigation, square forms and footer apply across the frontend. New readers
see the paper theme; saved dark-mode and language preferences remain supported.
Bias and operational status colors retain their meanings.

The homepage uses the original dev-dinithi animated news collage, staggered
headline entrance, bias scale, navigation buttons and live counts. Collage and
feed photos use CSS grayscale; original image files are unchanged. The collage
is hidden on small screens and respects reduced-motion preferences.

The analytics merge fix reads translated labels from the dictionaries rather
than the removed BIAS_DISPLAY constant. The Docker runtime copies public assets.

## Archived hero artwork

`frontend/public/images/newspaper-hero.png` is retained as an unused asset from
the earlier photo-led design. It is decorative generated artwork, not a photo
associated with a live news article. Created with the built-in image generation
tool using this prompt:

> Use case: photorealistic-natural. Asset type: website landing hero, wide landscape 3:2 photograph. Create a timeless black-and-white editorial photograph of an anonymous adult reading a large broadsheet newspaper held open in both hands, completely hiding their face, against softly lit pale linen curtains. Close framing on the newspaper, hands and upper torso, centered subject, tactile paper folds and dense indistinct newspaper columns, subtle film grain, natural side light, rich charcoal shadows, quiet sophisticated newspaper aesthetic. No logos, no legible headlines, no text overlays, no watermark. This is generic editorial artwork, not a depiction of a real news event.
