// Three button variants matching brand spec.
// PrimaryButton: Gold → Terracotta on hover, 0.3s. Always Title Case.
// SecondaryButton: outline-Slate, fills on hover.
// GhostButton: Pebble Grey text, deepens on hover.

const PrimaryButton = ({ children, className = "", ...rest }) => (
  <button {...rest}
    className={`btn-primary font-nunito font-bold px-8 py-3 rounded-full text-base focus-ring shadow-sm transition-all duration-300 ${className}`}>
    {children}
  </button>
);

const SecondaryButton = ({ children, className = "", ...rest }) => (
  <button {...rest}
    className={`btn-secondary font-nunito font-bold px-8 py-3 rounded-full text-base focus-ring transition-all duration-300 ${className}`}>
    {children}
  </button>
);

const GhostButton = ({ children, className = "", ...rest }) => (
  <button {...rest}
    className={`bg-transparent text-pebble-grey hover:text-deep-slate transition-colors duration-300 font-nunito font-bold px-6 py-3 rounded-full focus-ring ${className}`}>
    {children}
  </button>
);

window.PrimaryButton = PrimaryButton;
window.SecondaryButton = SecondaryButton;
window.GhostButton = GhostButton;
