$(document).ready(function () {
  let productList = [];
  let ganancias = 0;

  function updateTable() {
      let tableBody = $('#productTable');
      tableBody.empty();

      let total = 0;
      productList.forEach((product, index) => {
          total += product.precio * product.cantidad;
          tableBody.append(`
              <tr>
                  <td>${product.folio}</td>
                  <td>${product.precio}</td>
                  <td>
                      <button class="btn btn-primary decrement" data-index="${index}">-</button>
                      ${product.cantidad}
                      <button class="btn btn-primary increment" data-index="${index}">+</button>
                  </td>
                  <td>${product.dificultad}</td>
                  <td><button class="btn btn-danger delete" data-index="${index}">Eliminar</button></td>
              </tr>
          `);
      });

      $('#total').text(total);
      $('.increment').click(incrementProduct);
      $('.decrement').click(decrementProduct);
      $('.delete').click(deleteProduct);
  }

  function incrementProduct() {
      let index = $(this).data('index');
      productList[index].cantidad++;
      updateTable();
  }

  function decrementProduct() {
      let index = $(this).data('index');
      if (productList[index].cantidad > 0) {
          productList[index].cantidad--;
          ganancias += productList[index].precio;
          $('#ganancias').text(ganancias);
          updateTable();
      }
  }

  function deleteProduct() {
      let index = $(this).data('index');
      productList.splice(index, 1);
      updateTable();
  }

  function findProductByFolio(folio) {
    for (let i = 0; i < productList.length; i++) {
        if (productList[i].folio === folio) {
            return i;
        }
    }
    return -1;
}

$('#productForm').submit(function (event) {
  event.preventDefault();
  let product = {
      folio: $('#folio').val(),
      precio: parseFloat($('#precio').val()),
      cantidad: parseInt($('#cantidad').val()),
      dificultad: parseInt($('#dificultad').val()),
  };

  let existingProductIndex = findProductByFolio(product.folio);
  if (existingProductIndex !== -1) {
      productList[existingProductIndex].cantidad += product.cantidad;
  } else {
      productList.push(product);
  }

  updateTable();
  this.reset();
});

$('#exportCSV').click(function () {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Folio,Precio,Cantidad,Dificultad,Ganancias\n";

  productList.forEach(product => {
      csvContent += `${product.folio},${product.precio},${product.cantidad},${product.dificultad},\n`;
  });

  // Agregar ganancias en una nueva fila y columna
  csvContent += `,,,,${ganancias}\n`;

  let encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "productos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

function parseCSV(file) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (event) {
          const text = event.target.result;
          const lines = text.split('\n');
          const products = [];
          let importedGanancias = 0;
          for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line === '') continue;
              const [folio, precio, cantidad, dificultad, ganancias] = line.split(',');

              if (i === lines.length - 2) {
                  importedGanancias = parseFloat(ganancias);
              } else {
                  products.push({
                      folio,
                      precio: parseFloat(precio),
                      cantidad: parseInt(cantidad),
                      dificultad: parseInt(dificultad),
                  });
              }
          }
          resolve({ products, ganancias: importedGanancias });
      };
      reader.onerror = function (error) {
          reject(error);
      };
      reader.readAsText(file);
  });
}

$('#loadCSV').click(async function () {
  const fileInput = $('#importCSV')[0];
  if (fileInput.files.length === 0) {
      alert('Por favor, selecciona un archivo CSV.');
      return;
  }
  const file = fileInput.files[0];
  try {
      const { products: importedProducts, ganancias: importedGanancias } = await parseCSV(file);
      productList.push(...importedProducts);
      ganancias = importedGanancias;
      $('#ganancias').text(ganancias);
      updateTable();
  } catch (error) {
      alert('Error al leer el archivo CSV.');
      console.error(error);
  }
});

});
