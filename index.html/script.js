    let produtos = JSON.parse(localStorage.getItem("estoqueCasaNor")) || [];
    let editIndex = null;

    const form = document.getElementById("product-form");
    const tbody = document.getElementById("table-body");

    function salvarProdutos() {
      localStorage.setItem("estoqueCasaNor", JSON.stringify(produtos));
      renderizarTabela();
    }

    function renderizarTabela() {
      tbody.innerHTML = "";
      produtos.forEach((p, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td data-label="Produto">${p.nome}</td>
          <td data-label="Unidades">${p.estoque}</td>
          <td data-label="Qtd Física">${p.unidade}</td>
          <td data-label="Descrição">${p.descricao}</td>
          <td data-label="Ações" class="actions">
            <button class="edit" onclick="editarProduto(${i})">Editar</button>
            <button class="remove" onclick="removerProduto(${i})">Excluir</button>
            <button class="out" onclick="saidaProduto(${i})">Saída</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = document.getElementById("name").value.trim();
      const unidade = document.getElementById("unit").value.trim();
      const estoque = parseInt(document.getElementById("stock").value);
      const descricao = document.getElementById("desc").value.trim();

      if (!nome || !unidade || !descricao || estoque < 0) return;

      const produto = { nome, unidade, estoque, descricao };

      if (editIndex !== null) {
        produtos[editIndex] = produto;
        editIndex = null;
      } else {
        produtos.push(produto);
      }

      form.reset();
      salvarProdutos();
    });

    function editarProduto(index) {
      const p = produtos[index];
      document.getElementById("name").value = p.nome;
      document.getElementById("unit").value = p.unidade;
      document.getElementById("stock").value = p.estoque;
      document.getElementById("desc").value = p.descricao;
      editIndex = index;
    }

    function removerProduto(index) {
      if (confirm("Tem certeza que deseja excluir este item?")) {
        produtos.splice(index, 1);
        salvarProdutos();
      }
    }

    function saidaProduto(index) {
      const qtd = prompt("Quantidade a dar saída:");
      const quantidade = parseInt(qtd);
      if (!isNaN(quantidade) && quantidade > 0 && quantidade <= produtos[index].estoque) {
        produtos[index].estoque -= quantidade;
        salvarProdutos();
      } else {
        alert("Quantidade inválida.");
      }
    }

    renderizarTabela();