import Image from 'next/image';

type AppLogoProps = {
  className?: string;
  priority?: boolean;
};

export function AppLogo({ className = 'h-12 w-auto object-contain', priority = false }: AppLogoProps) {
  return (
    <Image
      src="/svg/logo.svg"
      alt="DGONIX Invoice Management"
      width={513}
      height={208}
      className={className}
      priority={priority}
    />
  );
}
