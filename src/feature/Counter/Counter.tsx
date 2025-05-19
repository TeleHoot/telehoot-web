import { FC, useEffect, useState } from "react";

export const Counter: FC<{ next: () => void }> = props => {
  const { next } = props;
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          next();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-9xl font-bold text-foreground">{count}</div>
    </div>
  );
};
