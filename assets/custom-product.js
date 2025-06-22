
class ProductOptions extends HTMLElement {
  constructor() {
    super();

    this.section = this.closest('.custom-product-section');
    this.optionSelectors = this.querySelectorAll('.option-selector');
    this.productForm = this.section.querySelector('custom-product-form');
    this.dataProduct = this.getProductDataProduct();
    this.dataFormatted = this.getProductDataFormatted();

    this.addEventListener('change', this.handleVariantChange.bind(this));
    this.init();
  }

  init() {
    this.optionsMap = {};
    if (this.dataProduct.options.length > 1) this.linkOptionSelectors(this.dataProduct);
  }

  linkOptionSelectors = function (product) {
    // Building our mapping object.

    for (var i = 0; i < product.variants.length; i++) {
      var variant = product.variants[i];
      if (variant) {
        // Gathering values for the 1st drop-down.
        this.optionsMap['root'] = this.optionsMap['root'] || [];
        this.optionsMap['root'].push(variant.option1);
        this.optionsMap['root'] = [...new Set(this.optionsMap['root'])];

        // Gathering values for the 2nd drop-down.
        if (product.options.length > 1) {
          var key = variant.option1;
          this.optionsMap[key] = this.optionsMap[key] || [];
          this.optionsMap[key].push(variant.option2);
          this.optionsMap[key] = [...new Set(this.optionsMap[key])];
        }
        // Gathering values for the 3rd drop-down.
        if (product.options.length === 3) {
          var key = variant.option1 + ' / ' + variant.option2;
          this.optionsMap[key] = this.optionsMap[key] || [];
          this.optionsMap[key].push(variant.option3);
          this.optionsMap[key] = [...new Set(this.optionsMap[key])];
        }
      }
    }

    // console.log('this.optionsMap', this.optionsMap);

    this.updateOptionsInSelector(0);
    if (product.options.length > 1) this.updateOptionsInSelector(1);
    if (product.options.length === 3) this.updateOptionsInSelector(2);

    const selectors = document.querySelectorAll('.single-option-selector');
    if (selectors[0]) {
      selectors[0].addEventListener('change', () => {
        this.updateOptionsInSelector(1);
        if (product.options.length === 3) this.updateOptionsInSelector(2);
      });
    }
    if (selectors[1] && product.options.length === 3) {
      selectors[1].addEventListener('change', () => {
        this.updateOptionsInSelector(2);
      });
    }
  };

  updateOptionsInSelector = function (selectorIndex) {
    switch (selectorIndex) {
      case 0:
        this.key = 'root';
        this.selector = this.querySelectorAll('.single-option-selector')[0];
        break;
      case 1:
        this.key = this.querySelectorAll('.single-option-selector')[0].value;
        this.selector = this.querySelectorAll('.single-option-selector')[1];
        break;
      case 2:
        this.key = this.querySelectorAll('.single-option-selector')[0].value;
        this.key += ' / ' + this.querySelectorAll('.single-option-selector')[1].value;
        this.selector = this.querySelectorAll('.single-option-selector')[2];
        break;
      case 3:
        this.key = this.querySelectorAll('.single-option-selector')[0].value + ' / ' +
          this.querySelectorAll('.single-option-selector')[1].value + ' / ' +
          this.querySelectorAll('.single-option-selector')[2].value;
        this.selector = this.querySelectorAll('.single-option-selector')[3];
        break;
    }

    var initialValue = this.selector.value;

    while (this.selector.firstChild) {
      this.selector.removeChild(this.selector.firstChild);
    }

    var availableOptions = this.optionsMap[this.key];
    var optionIndex = selectorIndex + 1;

    if(optionIndex > 1) {
      this.querySelectorAll('[data-option="option-' + optionIndex + '"] .option-wrapper').forEach((optionWrapper) => optionWrapper.style.display = 'none');
    }

    for (var i = 0; i < availableOptions.length; i++) {
      var option = availableOptions[i];
      var newOption = document.createElement('option');
      newOption.value = option;
      newOption.textContent = option;

      this.selector.appendChild(newOption);

      if (optionIndex > 1) {
        option = option.replace(/"/g, '\\"');
        this.querySelector('[data-option="option-' + optionIndex + '"] .option-wrapper[data-value="' + option + '"]').style.display = 'block';
      }
    }

    if (availableOptions.includes(initialValue)) {
      this.selector.value = initialValue;
    }

    var newValue = this.selector.value;

    var event = new Event('change');
    this.selector.dispatchEvent(event);

    let newValueBlock = this.querySelector('[data-option="option-' + optionIndex + '"] .option-wrapper[data-value="' + newValue + '"] input');
    newValueBlock.checked = true;
  };

  handleVariantChange(e) {
    const selectedOptions = this.getSelectedOptions();
    this.variant = null;

    this.variant = this.dataProduct.variants.find((v) =>
      v.options.every((val, index) => val === selectedOptions[index])
    );

    if (this.variant) {
      this.updateMedia();
      this.updateUrl(e);
      this.updateVariantInput();
    }

    this.updatePrice();
  }

  getProductDataProduct() {
    const dataElement = this.querySelector('[type="application/json"]');
    if (!dataElement || !dataElement.textContent) return null;

    const productData = JSON.parse(dataElement.textContent);
    return productData.product;
  }

  getProductDataFormatted() {
    const dataElement = this.querySelector('[type="application/json"]');
    let dataFormatted = {};

    try {
      const parsedData = JSON.parse(dataElement.textContent);
      if (parsedData && parsedData.formatted) {
        Object.entries(parsedData.formatted).forEach(([key, value]) => {
          dataFormatted[key] = value;
        });
      }
    } catch (error) {
      console.error(error);
    }

    return dataFormatted;
  }

  getSelectedOptions() {
    const selectedOptions = [];

    this.optionSelectors.forEach((selector) => {
      let checkedInput = selector.querySelector('input:checked').value;
      let select = selector.querySelector('select.single-option-selector');
      if (select) {
        if (select.value != checkedInput) {
          select.value = checkedInput;
          var event = new Event('change');
          select.dispatchEvent(event);
        }

      }

      selectedOptions.push(checkedInput);
    });

    return selectedOptions;
  }

  updatePrice() {
    this.price = this.price || this.section.querySelector('.product-price > .price');
    if (!this.price) return;

    if (this.variant) {
      this.price.innerHTML = this.dataFormatted[this.variant.id].price;
    }
  }

  updateVariantInput() {
    if (!this.productForm) return;

    const input = this.productForm.querySelector('input[name="id"]');
    input.value = this.variant.id;
  }

  updateMedia() {
    if (!this.variant || !this.variant.featured_media) return;

    const allMediaItems = this.section.querySelectorAll('.custom-product-media-item');
    const activeId = this.variant.featured_media.id.toString();

    allMediaItems.forEach(item => {
      const id = item.dataset.mediaId;
      item.style.display = id === activeId ? 'block' : 'none';
    });
  }

  updateUrl(e) {
    if (!e || e.type !== 'change' || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.variant.id}`);
  }
}

customElements.define('product-options', ProductOptions);
