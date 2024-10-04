// Warning when missing the lib-wrapper module
Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM) ui.notifications.error("Hex Grid Support requires the 'libWrapper' module. Please install and activate it.")
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

  // Snap the preview image to set distances and angles, holding shift bypasses this system
  libWrapper.register("snappy-templates", "TemplateLayer.prototype._onDragLeftMove", function(wrapped, ...args) {
    wrapped(...args);
    if (game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.SHIFT)) return;

    const directionSnapInterval = game.settings.get("snappy-templates", "directionSnapInterval");
    const distanceSnapInterval = game.settings.get("snappy-templates", "distanceSnapInterval");
    const previewDocument = args[0].interactionData.preview.document;
    if (directionSnapInterval) previewDocument.direction = Math.round(previewDocument.direction / directionSnapInterval) * directionSnapInterval;
    if (distanceSnapInterval) previewDocument.distance = Math.round(previewDocument.distance / distanceSnapInterval) * distanceSnapInterval;
  }, "WRAPPER");
});
