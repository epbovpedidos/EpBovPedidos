import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetOrder, 
  useDeleteOrder, 
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Edit, Trash2, FileText, Send, Calendar } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, formatDate } from "@/lib/format";
import { generateOrderPDF } from "@/lib/pdf-generator";
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

export default function PedidoView() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const orderId = parseInt(params.id as string);

  const { data: order, isLoading } = useGetOrder(orderId);
  const deleteOrder = useDeleteOrder();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [currentPdfFileName, setCurrentPdfFileName] = useState<string>("");

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
        <Link href="/pedidos">
          <Button variant="link" className="mt-4">Voltar para a lista</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    deleteOrder.mutate({ id: orderId }, {
      onSuccess: () => {
        toast({ title: "Pedido excluído com sucesso!" });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setLocation("/pedidos");
      },
      onError: () => {
        toast({ title: "Erro ao excluir pedido", variant: "destructive" });
        setIsDeleteDialogOpen(false);
      }
    });
  };

  const handleGeneratePdf = () => {
    try {
      const { blob, fileName } = generateOrderPDF(order, order.comprador, order.vendedor);
      setPdfBlobUrl(blob);
      setCurrentPdfFileName(fileName);
      setIsPdfDialogOpen(true);
    } catch (e) {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
      console.error(e);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`*PEDIDO DE COMPRA DE BOVINOS - EP BOV*\n\nPedido N°: ${order.numero}\nData: ${formatDate(order.dataEmissao)}\nComprador: ${order.comprador?.nome || '-'}\nVendedor: ${order.vendedor?.nome || '-'}\nTotal Animais: ${order.totalAnimais}\nValor Total: ${formatCurrency(order.totalValor)}\n\nObrigado pela preferência!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/pedidos">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Pedido {order.numero}</h1>
              <Badge variant={order.status === 'rascunho' ? 'secondary' : 'default'} className="mt-1">
                {order.status === 'rascunho' ? 'Rascunho' : 'Emitido'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Emitido em {formatDate(order.dataEmissao)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleGeneratePdf}>
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp}>
            <Send className="h-4 w-4 mr-2" /> WhatsApp
          </Button>
          <Link href={`/pedidos/${order.id}/editar`}>
            <Button variant="secondary" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3 border-primary/20 bg-primary/5">
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Data Embarque</div>
              <div className="font-semibold">{formatDate(order.dataEmbarque)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Data Desembarque</div>
              <div className="font-semibold">{formatDate(order.dataDesembarque)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Data Abate</div>
              <div className="font-semibold">{formatDate(order.dataAbate)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Data Compra</div>
              <div className="font-semibold">{formatDate(order.dataCompra)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Comprador / Vendedor */}
        <div className="md:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="text-lg">Comprador</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Nome:</span>
                <span className="font-medium">{order.comprador?.nome || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Fazenda:</span>
                <span className="text-sm">{order.comprador?.fazenda || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">CPF/CNPJ:</span>
                <span className="text-sm">{order.comprador?.cpfCnpj || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Inscrição:</span>
                <span className="text-sm">{order.comprador?.inscricao || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Endereço:</span>
                <span className="text-sm">{order.comprador?.endereco || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Cidade/UF:</span>
                <span className="text-sm">{(order.comprador?.municipio || '-') + '/' + (order.comprador?.uf || '-')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="text-lg">Vendedor</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Nome:</span>
                <span className="font-medium">{order.vendedor?.nome || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Fazenda:</span>
                <span className="text-sm">{order.vendedor?.fazenda || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">CPF/CNPJ:</span>
                <span className="text-sm">{order.vendedor?.cpfCnpj || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Inscrição:</span>
                <span className="text-sm">{order.vendedor?.inscricao || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Endereço:</span>
                <span className="text-sm">{order.vendedor?.endereco || '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-sm">Cidade/UF:</span>
                <span className="text-sm">{(order.vendedor?.municipio || '-') + '/' + (order.vendedor?.uf || '-')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {order.roteiro && (
          <Card className="md:col-span-3">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Roteiro e Transporte</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm whitespace-pre-wrap">{order.roteiro}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Preços */}
        <Card className="md:col-span-3 overflow-hidden">
          <CardHeader className="bg-card pb-4 border-b">
            <CardTitle className="text-lg">Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Espécie</TableHead>
                    <TableHead>Raça</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Peso (@)</TableHead>
                    <TableHead className="text-right">Preço/@ (R$)</TableHead>
                    <TableHead className="text-center">Rastr.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.especie}</TableCell>
                      <TableCell>{item.raca}</TableCell>
                      <TableCell>{item.idade}</TableCell>
                      <TableCell className="text-right">{item.quantidade}</TableCell>
                      <TableCell className="text-right">{item.peso}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.precoArroba)}</TableCell>
                      <TableCell className="text-center">{item.rastreabilidade ? 'Sim' : 'Não'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-primary/5 p-4 border-t flex flex-col sm:flex-row items-end justify-end gap-6 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Total de Animais</span>
                <span className="font-bold text-lg">{order.totalAnimais}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Peso Total (@)</span>
                <span className="font-bold text-lg">{order.totalPeso.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Valor Geral</span>
                <span className="font-bold text-xl text-primary">{formatCurrency(order.totalValor)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3 border-b mb-4">
            <CardTitle className="text-lg">Condições de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium">Forma:</span>
                <span className="font-bold">{order.formaPagamento}</span>
              </div>
              {order.formaPagamento === "A PRAZO" && order.prazoPagamento && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">Prazo:</span>
                  <span className="font-bold">{order.prazoPagamento}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b mb-4">
            <CardTitle className="text-lg">Dados Bancários (Vendedor)</CardTitle>
          </CardHeader>
          <CardContent>
            {order.vendedor?.banco || order.vendedor?.conta ? (
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Banco</span>
                  <span className="font-medium text-base">{order.vendedor.banco || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Agência</span>
                  <span className="font-medium text-base">{order.vendedor.agencia || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Conta</span>
                  <span className="font-medium text-base">{order.vendedor.conta || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Titular</span>
                  <span className="font-medium text-base">{order.vendedor.titular || order.vendedor.nome}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                Nenhum dado bancário cadastrado para este vendedor.
              </div>
            )}
          </CardContent>
        </Card>

        {order.observacao && (
          <Card className="md:col-span-3">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Observações Finais</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm whitespace-pre-wrap">{order.observacao}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pedido {order.numero} será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteOrder.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Visualizar PDF: {currentPdfFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full bg-muted">
            {pdfBlobUrl && (
              <iframe src={pdfBlobUrl} className="w-full h-full border-0" title="PDF Preview" />
            )}
          </div>
          <DialogFooter className="p-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPdfDialogOpen(false)}>Fechar</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                const a = document.createElement('a');
                a.href = pdfBlobUrl || '';
                a.download = currentPdfFileName;
                a.click();
              }}>
                <FileText className="h-4 w-4 mr-2" /> Baixar PDF
              </Button>
              <Button onClick={handleWhatsApp}>
                <Send className="h-4 w-4 mr-2" /> Enviar WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
