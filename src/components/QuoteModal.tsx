// src/components/QuoteModal.tsx
"use client";
import React, { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

type Props = { open: boolean; onClose: () => void };

const QuoteModal: React.FC<Props> = ({ open, onClose }) => {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Por favor ingresa tu nombre y WhatsApp.");
      return;
    }
    alert("Estamos trabajando en el sistema. Tu solicitud de cotización fue recibida.");
    setName("");
    setPhone("");
    setFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="transition-transform ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition-transform ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <DialogTitle className="text-2xl font-semibold text-[#234c4b]">
                  Cotiza tu catalizador
                </DialogTitle>

                <p className="mt-1 text-sm text-gray-600">
                  Sube una foto del catalizador o la cerámica (honeycomb) y tu WhatsApp.
                  Te responderemos con el valor estimado.
                </p>

                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Nombre <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#234c4b]"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        WhatsApp <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        pattern="^\+?\d{8,15}$"
                        title="Ingresa un número válido (8 a 15 dígitos, opcional +)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#234c4b]"
                        placeholder="+57 3001234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Foto del catalizador / cerámica
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#234c4b] file:px-4 file:py-2 file:text-white hover:file:bg-[#1e3f3e]"
                    />
                    {preview && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt="Vista previa"
                          className="mt-3 max-h-48 rounded-lg border"
                        />
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-gray-300 px-5 py-2 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-[#234c4b] px-6 py-2 text-white hover:bg-[#1e3f3e]"
                    >
                      Enviar cotización
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QuoteModal;
