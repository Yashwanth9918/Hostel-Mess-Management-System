
import React from "react";

const Logo = ({ src, size = 50, alt = "Logo" }) => {
  return (
    <div className="flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        style={{ width: size, height: size }}
        
      />
    </div>
  );
};

export default Logo;
