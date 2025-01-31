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
      "default": "snappy-templates.OriginSnapOptionDefault",
      "center": "snappy-templates.OriginSnapOptionCenter",
      "corner": "snappy-templates.OriginSnapOptionCorner"
    },
    default: "default"
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

  // Overwrites the snapping mode used by the getSnappedPoint function to a user selected value.
  function snapModeOverwrite(wrapped, point, behavior) {
    const originSnapMode = game.settings.get("snappy-templates", "originSnapMode");
    const M = CONST.GRID_SNAPPING_MODES;

    if (originSnapMode !== "default") behavior.mode = {center: M.CENTER, corner: M.VERTEX, edge: M.SIDE_MIDPOINT}[originSnapMode];
    return wrapped(point, behavior);
  };

  libWrapper.register("snappy-templates", "foundry.grid.HexagonalGrid.prototype.getSnappedPoint", snapModeOverwrite);
  libWrapper.register("snappy-templates", "foundry.grid.SquareGrid.prototype.getSnappedPoint", snapModeOverwrite);
});
