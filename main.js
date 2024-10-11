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

  // Adjust snapping for hex grid
  libWrapper.register("snappy-templates", "HexagonalGrid.prototype.getSnappedPosition", function(wrapped, x, y, interval, token) {
    const originSnapMode = game.settings.get("snappy-templates", "originSnapMode");
    // Passthrough
    if (originSnapMode === "both" || interval !== 5) return wrapped(x, y, interval, token);

    // Snap to center
    const center = this.getCenter(x, y);
    if (originSnapMode === "center") {
      return {x: center[0], y: center[1]};
    }

    // Snap to corner
    const w4 = canvas.grid.w / 4;
    const h4 = canvas.grid.h / 4;
    const dx = x - center[0];
    const dy = y - center[1];
    const ox = dx.between(-w4, w4) && !this.columnar ? 0 : Math.sign(dx);
    const oy = dy.between(-h4, h4) && this.columnar ? 0 : Math.sign(dy);
    return this._getClosestVertex(center[0], center[1], ox, oy);
  });

  // Adjust snapping for square grid
  libWrapper.register("snappy-templates", "SquareGrid.prototype.getSnappedPosition", function(wrapped, x, y, interval, options) {
    const originSnapMode = game.settings.get("snappy-templates", "originSnapMode");
    // Passthrough
    if (originSnapMode === "both" || interval !== 2) return wrapped(x, y, interval, options);

    // Snap to center / corner
    const position = (originSnapMode === "center" ? this.getCenter(x, y) : this._getNearestVertex(x, y));
    return {x: position[0], y: position[1]};
  });
});
