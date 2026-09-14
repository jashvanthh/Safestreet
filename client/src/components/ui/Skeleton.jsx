/**
 * components/ui/Skeleton.jsx
 *
 * Loading skeleton component for better loading states.
 */

const Skeleton = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
}) => {
  return (
    <div
      className={`
        ${width} ${height} ${rounded}
        bg-[var(--color-surface-elevated)] animate-pulse
        ${className}
      `.trim()}
    />
  );
};

export default Skeleton;
