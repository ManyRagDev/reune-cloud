import { useState } from 'react';
import { MapPin, Home, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAddresses, Address } from '@/hooks/useAddresses';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AddressSelectorProps {
  onAddressSelect: (address: Address) => void;
  disabled?: boolean;
}

export function AddressSelector({ onAddressSelect, disabled }: AddressSelectorProps) {
  const { addresses, loading } = useAddresses();
  const [open, setOpen] = useState(false);

  const primaryAddress = addresses.find(addr => addr.is_primary);
  const hasAddresses = addresses.length > 0;

  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.number}${address.complement ? ', ' + address.complement : ''}, ${address.neighborhood}, ${address.city}/${address.state}`;
  };

  const handleSelectAddress = (address: Address) => {
    onAddressSelect(address);
    setOpen(false);
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className="w-full">
        <MapPin className="h-4 w-4 mr-2" />
        Carregando endereços...
      </Button>
    );
  }

  if (!hasAddresses) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              <Button variant="outline" disabled className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Usar meu endereço
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              Você ainda não cadastrou nenhum endereço.<br />
              Vá em Minha Conta → Endereços para adicionar.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Se tem apenas um endereço, usar diretamente
  if (addresses.length === 1) {
    return (
      <Button 
        variant="outline" 
        onClick={() => handleSelectAddress(addresses[0])}
        disabled={disabled}
        className="w-full"
      >
        <Home className="h-4 w-4 mr-2" />
        Usar meu endereço: {addresses[0].nickname}
      </Button>
    );
  }

  // Se tem vários endereços, mostrar dropdown
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="w-full justify-between">
          <span className="flex items-center">
            <Home className="h-4 w-4 mr-2" />
            Usar meu endereço
          </span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[400px] max-h-[300px] overflow-y-auto">
        {primaryAddress && (
          <>
            <DropdownMenuItem 
              onClick={() => handleSelectAddress(primaryAddress)}
              className="flex flex-col items-start py-3"
            >
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4" />
                {primaryAddress.nickname}
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Principal
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {formatAddress(primaryAddress)}
              </span>
            </DropdownMenuItem>
            {addresses.filter(a => !a.is_primary).length > 0 && (
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Outros endereços
              </div>
            )}
          </>
        )}
        {addresses
          .filter(addr => !addr.is_primary)
          .map((address) => (
            <DropdownMenuItem 
              key={address.id}
              onClick={() => handleSelectAddress(address)}
              className="flex flex-col items-start py-3"
            >
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4" />
                {address.nickname}
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {formatAddress(address)}
              </span>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
