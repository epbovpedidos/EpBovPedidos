import { useState } from "react";
import { useListCustomers, useDeleteCustomer, getListCustomersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Search, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClientesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: customers, isLoading } = useListCustomers();
  const deleteCustomer = useDeleteCustomer();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filteredCustomers = customers?.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.cpfCnpj && c.cpfCnpj.includes(searchTerm)) ||
    (c.municipio && c.municipio.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCustomer.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: "Cliente excluído com sucesso!" });
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Erro ao excluir cliente", variant: "destructive" });
        setDeleteId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie compradores e vendedores.</p>
        </div>
        <Link href="/clientes/novo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, CPF/CNPJ ou cidade..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm("")}>
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome / Fazenda</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="font-medium">{customer.nome}</div>
                        {customer.fazenda && <div className="text-xs text-muted-foreground">{customer.fazenda}</div>}
                      </TableCell>
                      <TableCell>{customer.cpfCnpj || '-'}</TableCell>
                      <TableCell>
                        {customer.municipio ? `${customer.municipio}${customer.uf ? `/${customer.uf}` : ''}` : '-'}
                      </TableCell>
                      <TableCell>{customer.telefone || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/clientes/${customer.id}/editar`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => setDeleteId(customer.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
