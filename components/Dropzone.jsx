import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/solid'
const SageMakerService = require('../../server/sageMakerService');

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const sendImageToBackend = async (base64Image) => {
  try {
    const response = await fetch('http://localhost:3003/api/invoke-sagemaker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: base64Image }),
    });

    return  await response.json();
  } catch (error) {
    console.error('Error sending image to backend:', error);
  }
};
const Dropzone = ({ className }) => {
  const [files, setFiles] = useState([])
  const [rejected, setRejected] = useState([])

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (acceptedFiles?.length) {
      acceptedFiles.map(file => convertToBase64(file)
        .then(async (base64String) => {
          try {
            const result = await sendImageToBackend(base64String);
            console.log('rejected length ' + rejected.length);
            if (result.predicted_label === 'unknown_type') {
              console.log('The image is classified as "unknown_type".');
              setRejected(prevRejected => [
                ...prevRejected,
                file
              ]);
              console.log('rejected length ' + rejected.length);
              rejected.map(file => console.log(file));
            } else {
              console.log(`The image is classified as ${result.predicted_label}.`);
              setFiles(prevAccepted => [
                ...prevAccepted,
                file
              ]);
            }


            // acceptedFiles.map(file => console.log(file));
            // console.log('SageMaker Response:', result);
          } catch (error) {
            console.error('Error sending image to backend:', error);
          }
        })
        .catch(error => console.error('Error converting image to Base64:', error)));


  /*    setFiles(previousFiles => [
        ...previousFiles,
        ...acceptedFiles.map(file =>
          Object.assign(file, { preview: URL.createObjectURL(file) })
        )
      ])*/
/*      setRejected(previousFiles => [...previousFiles, ...rejectedFiles])*/
    }

  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
    },
    onDrop
  })

  useEffect(() => {
    // Revoke the data uris to avoid memory leaks
    return () => files.forEach(file => URL.revokeObjectURL(file.preview))
  }, [files])

  const removeFile = name => {
    setFiles(files => files.filter(file => file.name !== name))
    setRejected(files => files.filter(file => file.name !== name))
  }

  const removeAll = () => {
    setFiles([])
    setRejected([])
  }

  const removeRejected = name => {
    setRejected(files => files.filter(({ file }) => file.name !== name))
  }

  return (
    <form >
      <div
        {...getRootProps({
          className: className
        })}
      >
        <input {...getInputProps()} />
        <div className='flex flex-col items-center justify-center gap-4'>
          <ArrowUpTrayIcon className='w-5 h-5 fill-current' />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag & drop files here, or click to select files</p>
          )}
        </div>
      </div>

      <section className='mt-10'>
        <div className='flex gap-4'>
          <h2 className='title text-3xl font-semibold'>Preview</h2>
          <button
            type='button'
            onClick={removeAll}
            className='mt-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-secondary-400 rounded-md px-3 hover:bg-secondary-400 hover:text-white transition-colors'
          >
            Remove all files
          </button>

        </div>

        {/* Accepted files */}
        <h3 className='title text-lg font-semibold text-neutral-600 mt-10 border-b pb-3'>
          Accepted Files
        </h3>
        <ul className='mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-10'>
          {files.map(file => (
            <li key={file.name} className='relative h-32 rounded-md shadow-lg'>
              <Image
                src={file.preview}
                alt={file.name}
                width={100}
                height={100}
                onLoad={() => {
                  URL.revokeObjectURL(file.preview)
                }}
                className='h-full w-full object-contain rounded-md'
              />
              <button
                type='button'
                className='w-7 h-7 border border-secondary-400 bg-secondary-400 rounded-full flex justify-center items-center absolute -top-3 -right-3 hover:bg-white transition-colors'
                onClick={() => removeFile(file.name)}
              >
                <XMarkIcon className='w-5 h-5 fill-white hover:fill-secondary-400 transition-colors' />
              </button>
              <p className='mt-2 text-neutral-500 text-[12px] font-medium'>
                {file.name}
              </p>
            </li>
          ))}
        </ul>

        {/* Rejected Files */}
        <h3 className='title text-lg font-semibold text-neutral-600 mt-24 border-b pb-3'>
          Rejected Files
        </h3>
       {/* <ul className='mt-6 flex flex-col'>
          {rejected.map(({ file, errors }) => (
            <li key={file.name} className='flex items-start justify-between'>
              <div>
                <p className='mt-2 text-neutral-500 text-sm font-medium'>
                  {file.name}
                </p>
                <ul className='text-[12px] text-red-400'>
                  {errors.map(error => (
                    <li key={error.code}>{error.message}</li>
                  ))}
                </ul>
              </div>
              <button
                type='button'
                className='mt-1 py-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-secondary-400 rounded-md px-3 hover:bg-secondary-400 hover:text-white transition-colors'
                onClick={() => removeRejected(file.name)}
              >
                remove
              </button>
            </li>
          ))}
        </ul>*/}
      </section>
    </form>
  )
}

export default Dropzone
