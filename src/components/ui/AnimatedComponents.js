// Reusable animated UI components
import React, { useState, useEffect, useRef } from 'react';

// Skeleton Loading Components
export const Skeleton = ({ className = '', variant = 'text', width, height }) => {
  const baseClasses = 'skeleton rounded';
  const variantClasses = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    thumbnail: 'h-32 w-full',
    button: 'h-10 w-24',
    card: 'h-48 w-full',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant] || ''} ${className}`}
      style={style}
    />
  );
};

// Card Skeleton for dashboard items
export const CardSkeleton = ({ lines = 3 }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-start space-x-4">
      <Skeleton variant="avatar" />
      <div className="flex-1 space-y-3">
        <Skeleton variant="title" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={i === lines - 1 ? 'w-2/3' : ''} />
        ))}
      </div>
    </div>
    <div className="mt-4 flex space-x-2">
      <Skeleton variant="button" />
      <Skeleton variant="button" className="w-20" />
    </div>
  </div>
);

// List Skeleton
export const ListSkeleton = ({ count = 3, showAvatar = true }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center space-x-4 animate-fade-in"
        style={{ animationDelay: `${i * 100}ms` }}
      >
        {showAvatar && <Skeleton variant="avatar" />}
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" />
          <Skeleton className="w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// Animated Card with entrance animation
export const AnimatedCard = ({
  children,
  delay = 0,
  className = '',
  hover = true,
  onClick
}) => {
  return (
    <div
      className={`
        animate-slide-up opacity-0
        ${hover ? 'card-interactive' : ''}
        ${className}
      `}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Staggered List Animation
export const StaggeredList = ({ children, staggerDelay = 100 }) => {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, {
          className: `${child.props.className || ''} animate-slide-up opacity-0`,
          style: {
            ...child.props.style,
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: 'forwards'
          }
        });
      })}
    </>
  );
};

// Fade In on Scroll
export const FadeInOnScroll = ({ children, threshold = 0.1 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  );
};

// Animated Counter
export const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const endValue = parseInt(end, 10);

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOut * endValue);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [hasStarted, end, duration]);

  return (
    <span ref={countRef}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Loading Spinner - Enhanced dual-ring style
export const LoadingSpinner = ({ size = 'md', className = '', showDots = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const borderClasses = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4'
  };

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} ${borderClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
        <div
          className={`absolute inset-0 ${sizeClasses[size]} ${borderClasses[size]} border-transparent border-b-blue-400 rounded-full animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        ></div>
      </div>
      {showDots && (
        <div className="mt-4 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${dotSizes[size]} bg-blue-500 rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Loading Overlay
export const LoadingOverlay = ({ isLoading, children, blur = true }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-white/80 ${blur ? 'backdrop-blur-sm' : ''} z-10 animate-fade-in-fast`}>
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  );
};

// Full Page Loader - For full-screen loading states
export const FullPageLoader = ({
  message = 'Loading...',
  subMessage = '',
  showDots = true,
  size = 'lg',
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4 ${className}`}>
      <div className="text-center animate-fade-in">
        <LoadingSpinner size={size} showDots={showDots} />
        <p className="mt-6 text-lg sm:text-xl font-semibold text-gray-900 animate-pulse-soft">
          {message}
        </p>
        {subMessage && (
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
};

// Animated Progress Bar
export const AnimatedProgressBar = ({ progress, className = '', showLabel = true }) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-blue-600">{Math.round(displayProgress)}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full progress-bar transition-all duration-1000 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  );
};

// Animated Badge
export const AnimatedBadge = ({ children, variant = 'default', pulse = false, className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variants[variant]}
        ${pulse ? 'badge-pulse' : ''}
        animate-scale-in
        ${className}
      `}
    >
      {children}
    </span>
  );
};

// Tooltip Component
export const Tooltip = ({ children, content, position = 'top' }) => {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="group relative inline-block">
      {children}
      <div className={`
        absolute ${positions[position]}
        px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg
        tooltip-animate whitespace-nowrap z-50
      `}>
        {content}
        <div className={`
          absolute w-2 h-2 bg-gray-900 rotate-45
          ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
          ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
        `} />
      </div>
    </div>
  );
};

// Animated Button
export const AnimatedButton = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) => {
  const variants = {
    primary: 'btn-primary bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'btn-secondary bg-gray-100 hover:bg-gray-200 text-gray-800',
    outline: 'btn-secondary border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'btn-secondary text-gray-600 hover:bg-gray-100',
    danger: 'btn-primary bg-red-600 hover:bg-red-700 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        ${variants[variant]} ${sizes[size]}
        rounded-lg font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="border-current" />}
      {children}
    </button>
  );
};

// Page Transition Wrapper
export const PageTransition = ({ children }) => {
  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};

// Section with animated header
export const AnimatedSection = ({ title, subtitle, children, className = '' }) => {
  return (
    <section className={`animate-slide-up ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-gray-600">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
};

// Empty State with animation
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-scale-in">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-float">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      {action && (
        <AnimatedButton onClick={action}>
          {actionLabel}
        </AnimatedButton>
      )}
    </div>
  );
};

export default {
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  AnimatedCard,
  StaggeredList,
  FadeInOnScroll,
  AnimatedCounter,
  LoadingSpinner,
  LoadingOverlay,
  FullPageLoader,
  AnimatedProgressBar,
  AnimatedBadge,
  Tooltip,
  AnimatedButton,
  PageTransition,
  AnimatedSection,
  EmptyState,
};
