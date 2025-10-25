import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddressCard } from './AddressCard';
import { AddressFormDialog } from './AddressFormDialog';
import { useAddresses, Address } from '@/hooks/useAddresses';

export function AddressList() {
  const { addresses, loading, addAddress, updateAddress, deleteAddress, setPrimaryAddress } = useAddresses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingAddress) {
      await updateAddress(editingAddress.id, data);
    } else {
      await addAddress(data);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAddress(id);
  };

  const handleSetPrimary = async (id: string) => {
    await setPrimaryAddress(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Carregando endereços...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Meus Endereços</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie seus endereços para usar em eventos
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Endereço
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Você ainda não tem endereços cadastrados
          </p>
          <Button onClick={handleAddNew} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Endereço
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
            />
          ))}
        </div>
      )}

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        address={editingAddress}
      />
    </div>
  );
}

function MapPin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
