import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "./format";
import { Order, Customer } from "@workspace/api-client-react";

export function generateOrderPDF(order: Order, comprador?: Customer, vendedor?: Customer) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EP COMERCIO DE BOVINOS", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("CNPJ: 63.078.738/0001-91", 14, 26);
  doc.text("Telefone: (66) 99631-9292", 14, 31);
  doc.text("Endereço: Al. Das Rosas, 2500, Vila Aurora – Rondonópolis-MT", 14, 36);
  
  // Order Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`PEDIDO N° ${order.numero}`, pageWidth - 14, 20, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Data de Emissão: ${formatDate(order.dataEmissao)}`, pageWidth - 14, 26, { align: "right" });
  
  doc.line(14, 40, pageWidth - 14, 40);

  // Cronograma
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Cronograma", 14, 48);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Data de Embarque: ${formatDate(order.dataEmbarque)}`, 14, 54);
  doc.text(`Data de Desembarque: ${formatDate(order.dataDesembarque)}`, pageWidth / 2, 54);
  doc.text(`Data do Abate: ${formatDate(order.dataAbate)}`, 14, 60);

  doc.line(14, 64, pageWidth - 14, 64);

  // Comprador and Vendedor
  const colWidth = (pageWidth - 28) / 2;
  
  // Comprador
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Comprador", 14, 72);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${comprador?.nome || "-"}`, 14, 78);
  doc.text(`Fazenda: ${comprador?.fazenda || "-"}`, 14, 83);
  doc.text(`CPF/CNPJ: ${comprador?.cpfCnpj || "-"}`, 14, 88);
  doc.text(`Inscrição: ${comprador?.inscricao || "-"}`, 14, 93);
  doc.text(`Endereço: ${comprador?.endereco || "-"}`, 14, 98);
  doc.text(`Município/UF: ${comprador?.municipio || "-"}/${comprador?.uf || "-"}`, 14, 103);

  // Vendedor
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Vendedor", 14 + colWidth, 72);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${vendedor?.nome || "-"}`, 14 + colWidth, 78);
  doc.text(`Fazenda: ${vendedor?.fazenda || "-"}`, 14 + colWidth, 83);
  doc.text(`CPF/CNPJ: ${vendedor?.cpfCnpj || "-"}`, 14 + colWidth, 88);
  doc.text(`Inscrição: ${vendedor?.inscricao || "-"}`, 14 + colWidth, 93);
  doc.text(`Endereço: ${vendedor?.endereco || "-"}`, 14 + colWidth, 98);
  doc.text(`Município/UF: ${vendedor?.municipio || "-"}/${vendedor?.uf || "-"}`, 14 + colWidth, 103);

  let currentY = 110;

  // Roteiro
  if (order.roteiro) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Roteiro:", 14, currentY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitRoteiro = doc.splitTextToSize(order.roteiro, pageWidth - 28);
    doc.text(splitRoteiro, 14, currentY + 6);
    currentY += 6 + (splitRoteiro.length * 5) + 4;
  }

  // Tabela de Preços
  const tableData = order.items.map(item => [
    item.especie,
    item.raca,
    item.idade,
    item.quantidade.toString(),
    item.peso.toString(),
    formatCurrency(item.precoArroba),
    formatCurrency(item.total)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Espécie', 'Raça', 'Idade', 'Qtd', 'Peso (@)', 'Preço/@', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50] },
    foot: [['', '', 'Total', order.totalAnimais.toString(), order.totalPeso.toString(), '', formatCurrency(order.totalValor)]],
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Condições de Pagamento
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Condições de Pagamento", 14, currentY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Forma de Pagamento: ${order.formaPagamento}`, 14, currentY + 6);
  if (order.formaPagamento === "A PRAZO" && order.prazoPagamento) {
    doc.text(`Prazo: ${order.prazoPagamento}`, 14, currentY + 11);
  }

  // Dados Bancários
  if (vendedor?.banco || vendedor?.conta) {
    currentY += 20;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Dados Bancários (Vendedor)", 14, currentY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Banco: ${vendedor.banco || "-"}`, 14, currentY + 6);
    doc.text(`Agência: ${vendedor.agencia || "-"}`, 14, currentY + 11);
    doc.text(`Conta: ${vendedor.conta || "-"}`, 14 + colWidth, currentY + 6);
    doc.text(`Titular: ${vendedor.titular || "-"}`, 14 + colWidth, currentY + 11);
  }

  currentY += 20;

  // Observações
  if (order.observacao) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Observações", 14, currentY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitObs = doc.splitTextToSize(order.observacao, pageWidth - 28);
    doc.text(splitObs, 14, currentY + 6);
    currentY += 6 + (splitObs.length * 5) + 10;
  } else {
    currentY += 10;
  }

  // Assinaturas
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 20;
  }

  doc.line(20, currentY, (pageWidth / 2) - 10, currentY);
  doc.line((pageWidth / 2) + 10, currentY, pageWidth - 20, currentY);
  
  doc.text(comprador?.nome || "Comprador", pageWidth / 4, currentY + 5, { align: "center" });
  doc.text(vendedor?.nome || "Vendedor", (pageWidth / 4) * 3, currentY + 5, { align: "center" });

  const fileName = `${order.numero}_${comprador?.nome?.toUpperCase().replace(/\s+/g, '') || 'PEDIDO'}.pdf`;
  
  return {
    blob: doc.output('bloburl').toString(),
    fileName
  };
}
