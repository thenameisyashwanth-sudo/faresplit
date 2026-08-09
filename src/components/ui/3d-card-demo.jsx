import React from 'react'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'

export function ThreeDCardDemo({
  title = 'Make things float in air',
  description = 'Hover over this card to unleash the power of 3D CSS perspective',
  imageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop',
  buttonText = 'Explore Trip',
  onAction,
}) {
  return (
    <CardContainer className="inter-var py-4">
      <CardBody className="bg-white/90 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-3xl p-6 border shadow-xl backdrop-blur-xl">
        <CardItem
          translateZ="50"
          className="text-xl font-black text-gray-900 dark:text-white"
        >
          {title}
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-gray-500 text-xs max-w-sm mt-2 font-medium dark:text-neutral-300"
        >
          {description}
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <img
            src={imageUrl}
            height="1000"
            width="1000"
            className="h-52 w-full object-cover rounded-2xl group-hover/card:shadow-xl transition duration-300"
            alt="thumbnail"
          />
        </CardItem>
        <div className="flex justify-between items-center mt-6">
          <CardItem
            translateZ={20}
            as="button"
            onClick={onAction}
            className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-white"
          >
            Learn more →
          </CardItem>
          <CardItem
            translateZ={20}
            as="button"
            onClick={onAction}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
          >
            {buttonText}
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  )
}

export default ThreeDCardDemo
