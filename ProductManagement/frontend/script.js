// When running under Docker Compose, the backend maps to http://localhost:3000
// We use an explicit API base URL to avoid cross-origin confusion when serving the frontend from a different port.
const apiBase = 'http://localhost:3000/api';
let currentPage = 1;
const perPage = 10; 

function showError(msg) {
  alert(msg);
}

function loadCategories() {
  return $.ajax({ url: `${apiBase}/categories`, method: 'GET' }).done(res => {
    const categories = res.data;
    $('#category').empty();
    $('#category-filter').append('<option value="">All categories</option>');
    categories.forEach(c => {
      $('#category').append(`<option value="${c.name}">${c.name}</option>`);
      $('#category-filter').append(`<option value="${c.name}">${c.name}</option>`);
    });
  }).fail(() => showError('Failed to load categories'));
}

function displayProducts(products) {
  const tbody = $('#products-table tbody');
  tbody.empty();
  products.forEach(p => {
    const row = $(
      `<tr>
        <td>${p.name}</td>
        <td>${p.description || ''}</td>
        <td>${Number(p.price).toFixed(2)}</td>
        <td>${p.category || ''}</td>
        <td>${p.stock_quantity}</td>
        <td>
          <button class="edit" data-id="${p.id}">Edit</button>
          <button class="delete" data-id="${p.id}">Delete</button>
        </td>
      </tr>`
    );
    tbody.append(row);
  });
}

function loadProducts(page = 1) {
  currentPage = page;
  const q = $('#search').val();
  const category = $('#category-filter').val();
  $.ajax({
    url: `${apiBase}/products`,
    method: 'GET',
    data: { page, per_page: perPage, q, category }
  }).done(response => {
    displayProducts(response.data);
    // pagination UI simple
    const pagination = $('#pagination');
    pagination.empty();
    const total = response.pagination.total;
    const totalPages = Math.ceil(total / response.pagination.per_page);
    for (let i = 1; i <= totalPages; i++) {
      const btn = $(`<button class="page">${i}</button>`);
      if (i === page) btn.attr('disabled', true);
      btn.on('click', () => loadProducts(i));
      pagination.append(btn);
    }
  }).fail(() => showError('Failed to load products'));
}

function createProduct(productData) {
  return $.ajax({
    url: `${apiBase}/products`,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(productData)
  }).done(() => {
    loadProducts(currentPage);
  }).fail(() => showError('Create failed'));
}

function updateProduct(productId, productData) {
  return $.ajax({
    url: `${apiBase}/products/${productId}`,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify(productData)
  }).done(() => {
    loadProducts(currentPage);
  }).fail(() => showError('Update failed'));
}

function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  return $.ajax({
    url: `${apiBase}/products/${productId}`,
    method: 'DELETE'
  }).done(() => {
    loadProducts(currentPage);
  }).fail(() => showError('Delete failed'));
}

function openModal(mode = 'add', product = null) {
  $('#modal').show().removeClass('hidden').addClass('show').attr('aria-hidden', 'false');
  if (mode === 'add') {
    $('#modal-title').text('Add Product');
    $('#product-id').val('');
    $('#product-form')[0].reset();
  } else {
    $('#modal-title').text('Edit Product');
    $('#product-id').val(product.id);
    $('#name').val(product.name);
    $('#description').val(product.description);
    $('#price').val(product.price);
    $('#category').val(product.category);
    $('#stock_quantity').val(product.stock_quantity);
  }
  // put focus on name field for accessibility
  setTimeout(() => $('#name').focus(), 100);
}

function closeModal() {
  $('#modal').removeClass('show').addClass('hidden');
  setTimeout(() => {
    $('#modal').hide().attr('aria-hidden', 'true');
  }, 300); // Wait for animation to complete
}

$(document).ready(() => {
  loadCategories().always(() => loadProducts());

  $('#search').on('input', () => {
    loadProducts(1);
  });

  $('#category-filter').on('change', () => {
    loadProducts(1);
  });

  $('#add-product').on('click', () => openModal('add'));

  $('#cancel').on('click', closeModal);
  $('#modal-close').on('click', closeModal);
  // clicking outside the modal content closes
  $('#modal').on('click', function (e) {
    if (e.target.id === 'modal') closeModal();
  });

  $('#product-form').on('submit', function (e) {
    e.preventDefault();
    const id = $('#product-id').val();
    const data = {
      name: $('#name').val(),
      description: $('#description').val(),
      price: Number($('#price').val()),
      category: $('#category').val(),
      stock_quantity: Number($('#stock_quantity').val() || 0)
    };
    if (id) {
      updateProduct(id, data).then(() => closeModal());
    } else {
      createProduct(data).then(() => closeModal());
    }
  });

  $('#products-table').on('click', '.edit', function () {
    const id = $(this).data('id');
    $.ajax({ url: `${apiBase}/products/${id}`, method: 'GET' }).done(res => {
      openModal('edit', res.data);
    }).fail(() => showError('Failed to load product'));
  });

  $('#products-table').on('click', '.delete', function () {
    const id = $(this).data('id');
    deleteProduct(id);
  });
});
