const AuthImagePattern = ({ title, subtitle }) => {
    return (
      <div className="hidden lg:flex items-center justify-center bg-gray-50 dark:bg-base-200 p-12 w-full">
        <div className="flex flex-col items-center text-center">
          {/* Animated 3x3 tiles */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-xl bg-violet-500/20 backdrop-blur-sm animate-crazy"
                style={{
                  animationDelay: `${i * 200}ms`,
                  animationDuration: `${2.5 + (i % 3)}s`,
                }}
              />
            ))}
          </div>
  
          {/* Text content */}
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
    );
  };
  
  export default AuthImagePattern;
  