export const ValidationMessages = {
  // Boolean
  isBoolean: (field: string) => `El campo '${field}' debe ser verdadero o falso`,

  // Date
  isDate: (field: string) => `El campo '${field}' debe ser una fecha válida`,
  isDateString: (field: string) =>
    `El campo '${field}' debe ser una cadena con formato de fecha`,

  // Empty / not empty
  isEmpty: (field: string) => `El campo '${field}' debe estar vacío`,
  isNotEmpty: (field: string) => `El campo '${field}' es obligatorio`,

  // Enum
  isEnum: (field: string) => `El campo '${field}' debe tener un valor válido`,

  // Email
  isEmail: (field: string) =>
    `El campo '${field}' debe ser un correo electrónico válido`,

  // Length
  minLength: (field: string, min: number) =>
    `El campo '${field}' debe tener al menos ${min} caracteres`,
  maxLength: (field: string, max: number) =>
    `El campo '${field}' no debe exceder los ${max} caracteres`,
  length: (field: string, min: number, max: number) =>
    `El campo '${field}' debe tener entre ${min} y ${max} caracteres`,

  // Number
  isNumber: (field: string) => `El campo '${field}' debe ser un número`,
  isInt: (field: string) => `El campo '${field}' debe ser un número entero`,
  min: (field: string, min: number) =>
    `El campo '${field}' debe ser como mínimo ${min}`,
  max: (field: string, max: number) =>
    `El campo '${field}' debe ser como máximo ${max}`,

  // Optional
  isOptional: (_field: string) => `Este campo es opcional`, // No suele usarse para mostrar errores

  // String
  isString: (field: string) => `El campo '${field}' debe ser una cadena de texto`,
  isAlpha: (field: string) => `El campo '${field}' solo debe contener letras`,
  isAlphanumeric: (field: string) =>
    `El campo '${field}' solo debe contener letras y números`,
  isAscii: (field: string) =>
    `El campo '${field}' solo debe contener caracteres ASCII`,
  isLowercase: (field: string) => `El campo '${field}' debe estar en minúsculas`,
  isUppercase: (field: string) => `El campo '${field}' debe estar en mayúsculas`,
  matches: (field: string) => `El campo '${field}' no tiene el formato esperado`,
  isIn: (field: string) => `El campo '${field}' contiene un valor no permitido`,

  // UUID
  isUUID: (field: string) => `El campo '${field}' debe ser un UUID válido`,

  // Custom
  isDefined: (field: string) => `El campo '${field}' debe estar definido`,
  isPositive: (field: string) =>
    `El campo '${field}' debe ser un número positivo`,
  isNegative: (field: string) =>
    `El campo '${field}' debe ser un número negativo`,
  isUnique: (field: string) => `Ya existe un registro con ese '${field}'`,
};
