import { useState } from "react";
import { Link } from "wouter";
import { useListOrders, useDeleteOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, MoreVertical, Eye, Edit, Trash2, MessageCircle, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PedidosList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: orders, isLoading } = useListOrders();
  const deleteOrder = useDeleteOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filteredOrders = orders?.filter(o => {
    const matchesSearch = 
      o.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.compradorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.vendedorNome.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDelete = () => {
    if (!deleteId) return;
    deleteOrder.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: "Pedido excluído com sucesso!" });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Erro ao excluir pedido", variant: "destructive" });
        setDeleteId(null);
      }
    });
  };

  const handleWhatsApp = (order: any) => {
    const text = encodeURIComponent(`*PEDIDO DE COMPRA DE BOVINOS - EP BOV*\n\nPedido N°: ${order.numero}\nData: ${formatDate(order.dataEmissao)}\nComprador: ${order.compradorNome}\nVendedor: ${order.vendedorNome}\nTotal Animais: ${order.totalAnimais}\n\nObrigado pela preferência!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Pedidos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os pedidos emitidos e rascunhos.</p>
        </div>
        <Link href="/pedidos/novo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por número, comprador ou vendedor..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="emitido">Emitido</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
              {(searchTerm || statusFilter !== "all") && (
                <Button variant="link" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
                  Limpar filtros
                </Button>
              )}
              {orders?.length === 0 && (
                <div className="mt-4">
                  <Link href="/pedidos/novo">
                    <Button variant="outline">Criar primeiro pedido</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Animais</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/pedidos/${order.id}`}>
                          <a className="text-primary hover:underline">{order.numero}</a>
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(order.dataEmissao)}</TableCell>
                      <TableCell>{order.compradorNome}</TableCell>
                      <TableCell>{order.vendedorNome}</TableCell>
                      <TableCell className="text-right">{order.totalAnimais}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.totalValor)}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'rascunho' ? 'secondary' : 'default'} className="font-normal">
                          {order.status === 'rascunho' ? 'Rascunho' : 'Emitido'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/pedidos/${order.id}`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" /> Visualizar
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/pedidos/${order.id}/editar`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleWhatsApp(order)}>
                              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => setDeleteId(order.id)}
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
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pedido será removido permanentemente.
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
