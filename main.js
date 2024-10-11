// Warning when missing the lib-wrapper module
Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM) ui.notifications.error("Snappy Templates requires the 'libWrapper' module. Please install and activate it.")
});

Hooks.once("init", () => {
  // Module setting registration
  game.settings.register("snappy-templates", "directionSnapInterval", {
    name: "snappy-templates.DirectionSnapIntervalName",
    hint: "snappy-templates.DirectionSnapIntervalHint",
    scope: "client",
    config: true,
    type: Number,
    default: 0
  });
  game.settings.register("snappy-templates", "distanceSnapInterval", {
    name: "snappy-templates.DistanceSnapIntervalName",
    hint: "snappy-templates.DistanceSnapIntervalHint",
    scope: "client",
    config: true,
    type: Number,
    default: 0
  });
  game.settings.register("snappy-templates", "originSnapMode", {
    name: "snappy-templates.OriginSnapModeName",
    hint: "snappy-templates.OriginSnapModeHint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      "both": "snappy-templates.OriginSnapOptionBoth",
      "center": "snappy-templates.OriginSnapOptionCenter",
      "corner": "snappy-templates.OriginSnapOptionCorner"
    },
    default: "both"
  });

  // Snap the preview image to set distances and angles, holding shift bypasses this system
  libWrapper.register("snappy-templates", "TemplateLayer.prototype._onDragLeftMove", function(wrapped, event) {
    wrapped(event);
    if (game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.SHIFT)) return;

    const directionSnapInterval = game.settings.get("snappy-templates", "directionSnapInterval");
    const distanceSnapInterval = game.settings.get("snappy-templates", "distanceSnapInterval");
    const previewDocument = event.interactionData.preview.document;
    if (directionSnapInterval) previewDocument.direction = Math.round(previewDocument.direction / directionSnapInterval) * directionSnapInterval;
    if (distanceSnapInterval) previewDocument.distance = Math.round(previewDocument.distance / distanceSnapInterval) * distanceSnapInterval;
  }, "WRAPPER");

  // Snap the origin point based on user settings
  libWrapper.register("snappy-templates", "TemplateLayer.prototype._onDragLeftStart", function(wrapped, event) {
    const {x, y} = event.interactionData.origin;
    const result = wrapped(event);
    result.then(value => {
      const originSnapMode = game.settings.get("snappy-templates", "originSnapMode");
      if (this.options.snapToGrid && !event.shiftKey && originSnapMode !== "mixed") {
        // Snap to center
        let vertex = canvas.grid.getCenter(x, y);
        if (originSnapMode === "corner") {
          // Snap to corner - square grid
          if (canvas.grid.grid instanceof SquareGrid) {
            vertex = canvas.grid.grid._getNearestVertex(x, y);
          }
          // Snap to corder - hex grid
          else {
            const w4 = canvas.grid.w / 4;
            const h4 = canvas.grid.h / 4;
            const dx = x - vertex[0];
            const dy = y - vertex[1];
            const ox = dx.between(-w4, w4) && !canvas.grid.columnar ? 0 : Math.sign(dx);
            const oy = dy.between(-h4, h4) && canvas.grid.columnar ? 0 : Math.sign(dy);
            const vert = canvas.grid.grid._getClosestVertex(vertex[0], vertex[1], ox, oy);
            vertex[0] = vert.x;
            vertex[1] = vert.y;
          }
        }
        value.document.x = vertex[0];
        value.document.y = vertex[1];
      }
    });
    return result;
  });
});
