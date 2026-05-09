import Image from 'next/image';
import LOGO from '@/public/svg/logo.svg';

type AppLogoProps = {
  className?: string;
  priority?: boolean;
};

export function AppLogo({ className = 'h-12 w-auto object-contain', priority = false }: AppLogoProps) {
  return (
    <Image
      src="/svg/logo.svg"
      alt="Invoxa by Dgonix"
      width={513}
      height={208}
      className={className}
      priority={priority}
    />
  );
}
