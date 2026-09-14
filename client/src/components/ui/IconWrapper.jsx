/**
 * components/ui/IconWrapper.jsx
 *
 * Consistent icon sizing wrapper for Lucide icons.
 * Ensures uniform stroke width and sizing.
 */

const SIZES = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 28,
};

const IconWrapper = ({
  icon: Icon,
  size = 'md',
  strokeWidth = 2,
  className = '',
  ...props
}) => {
  const sizeValue = SIZES[size] || size;

  return (
    <Icon
      size={sizeValue}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
};

export default IconWrapper;
