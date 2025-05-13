const AuthImagePattern = ({ title, subtitle }) => {
    return (
      <div className="hidden lg:flex items-center justify-center bg-base-200 p-12 w-full">
        <div className="flex flex-col items-center text-center">
          {/* 3x3 animated tiles */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-xl bg-primary/20 animate-pulse"
                style={{ animationDelay: `${i * 150}ms`, animationDuration: '2s' }}
              />
            ))}
          </div>
  
          {/* Text content */}
          <h2 className="text-2xl font-semibold text-base-content mb-2">{title}</h2>
          <p className="text-base-content/60">{subtitle}</p>
        </div>
      </div>
    );
  };
  
  export default AuthImagePattern;
  