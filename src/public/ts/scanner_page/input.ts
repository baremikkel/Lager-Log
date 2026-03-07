document.addEventListener("keydown", function (event) {
  const inputField = document.getElementById("barcodeInput");

  const isTypingElsewhere =
    document.activeElement &&
    (document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "TEXTAREA");

  if (!isTypingElsewhere) {
    inputField?.focus();
  }
});
