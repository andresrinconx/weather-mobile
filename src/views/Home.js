import { View, Text, Image, StatusBar, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import React, {useState, useEffect, useCallback} from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CalendarDaysIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline'
import { MapPinIcon } from 'react-native-heroicons/solid'
import { debounce, times } from 'lodash'

import { theme } from '../theme'
import { fetchLocations, fetchWeatherForecast } from '../api/weather'
import { weatherImages } from '../constants'
import * as Progress from 'react-native-progress'
import { getData, storeData } from '../utils/asyncStorage'

const Home = () => {
  const [showSearch, setShowSearch] = useState(false)
  const [locations, setLocations] = useState([])
  const [weather, setWeather] = useState({})
  const [loading, setLoading] = useState(true)
  
  const handleLocation = (loc) => {
    setLocations([])
    setShowSearch(false)
    setLoading(true)

    fetchWeatherForecast({
      cityName: loc.name,
      days: '7'
    }).then(data => {
      setWeather(data) 
      setLoading(false)
      storeData('city', loc.name)
    })
  }
  
  const handleSearch = async (value) => {
    // fetch locations
    if(value.length > 2) {
      fetchLocations({cityName: value}).then(data => {setLocations(data)})
    }
  }

  useEffect(() => {
    fetchMyWeatherData()
  }, [])

  const fetchMyWeatherData = async () => {
    let myCity = await getData('city')
    let cityName = 'Caracas'
    if(myCity) {
      cityName = myCity
    }

    fetchWeatherForecast({
      cityName,
      days: '7'
    }).then(data => {
      setWeather(data)
      setLoading(false)
    })
  }

  const time = (localtime) => {
    const timeNow = localtime.split(" ")[1]
    return timeNow
  }

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), [])
    // useCallback ejecuta la funcion callback cada vez que se llame la funcion en si
      // puede tener un arreglo de dependencias al igual que useEffect
    // debounce retrasa la ejecucion de esa funcion un numero de milisegundos

  const { current, location } = weather

  return (
    <View className='flex-1 relative'>
      <StatusBar barStyle='light-content' backgroundColor='#083139' />
      <Image source={require('../assets/images/bg.png')} className='absolute h-full w-full' 
        blurRadius={70} // efecto de desenfoque
      />

      {loading
        ? (
          <View className='flex-1 flex-row justify-center items-center'>
            <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
          </View>
        ) : (
          <SafeAreaView className='flex flex-1 mt-3'>
            {/* search */}
            <View style={{height: '7%',}} className='mx-4 relative z-50'>
              <View className='flex-row justify-end items-center rounded-full'
                style={{backgroundColor: showSearch ? theme.bgWhite(0.2) : 'transparent',}}
              >
                {showSearch
                  && (
                    <TextInput className='pl-6 h-10 flex-1 text-base text-white'
                      placeholder='Search city'
                      placeholderTextColor={'lightgray'}
                      autoFocus={true} // se activa de una vez, recibe el enfoque
                      onChangeText={handleTextDebounce}
                    />
                  )
                }
                <TouchableOpacity onPress={() => setShowSearch(!showSearch)} className='rounded-full p-3 m-1'
                  style={{backgroundColor: theme.bgWhite(0.3),}}
                >
                  <MagnifyingGlassIcon size={30} color='white' />
                </TouchableOpacity>
              </View>

              {locations.length > 0 && showSearch
                ? (
                  <View className='absolute w-full bg-gray-300 top-16 rounded-3xl'>
                    {locations.map((loc, index) => {
                      let showBorder = index + 1 != locations.length
                      let borderClass = showBorder ? 'border-b-2 border-b-gray-400' : ''

                      return (
                        <TouchableOpacity onPress={() => handleLocation(loc)} 
                          className={`flex-row items-center border-0  p-3 mb-1 ${borderClass}`}
                          key={index}
                        >
                          <MapPinIcon size={25} color='gray' />
                          <Text className='text-black text-lg ml-2'>{loc?.name}, {loc?.country}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                ) : (
                  null
                )
              }
            </View>

            {/* forecast section */}
            <View className={`mx-4 flex justify-around flex-1 mb-2 ${showSearch ? 'top-full' : ''}`}>
              {/* location */}
              <Text className='text-gray-300 text-center text-lg font-semibold'>
                <Text className='text-white text-2xl font-bold'>{location?.name}, </Text>{location?.country}
              </Text>

              {/* weather image */}
              <View className='flex-row justify-center'>
                <Image source={weatherImages[current?.condition?.text]} className='w-52 h-52' />
              </View>

              {/* degree */}
              <View className='space-y-2'>
                <Text className='text-center font-bold text-white text-6xl ml-5'>{current?.temp_c}&#176;</Text>
                <Text className='text-center text-white text-xl ml-5'>{current?.condition?.text}</Text>
              </View>

              {/* stats */}
              <View className='flex-row justify-between mx-4'>
                <View className='flex-row space-x-2 items-center'>
                  <Image source={require('../assets/icons/wind.png')} className='w-6 h-6' />
                  <Text className='text-white font-semibold text-base'>{current?.wind_kph}km</Text>
                </View>
                <View className='flex-row space-x-2 items-center'>
                  <Image source={require('../assets/icons/drop.png')} className='w-6 h-6' />
                  <Text className='text-white font-semibold text-base'>{current?.humidity}%</Text>
                </View>
                <View className='flex-row space-x-2 items-center'>
                  <Image source={require('../assets/icons/sun.png')} className='w-6 h-6' />
                  <Text className='text-white font-semibold text-base'>{time(location?.localtime)} AM</Text>
                </View>
              </View>

              {/* forecast for next days */}
              <View className='mb-2 space-y-3'>
                <View className='flex-row items-center space-x-2'>
                  <CalendarDaysIcon size={22} color='white' />
                  <Text className='text-white'>Daily forecast</Text>
                </View>

                <ScrollView className='space-x-3 -mx-5'
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{paddingHorizontal: 15,}}
                >
                  {
                    weather?.forecast?.forecastday?.map((item, index) => {
                      let date = new Date(item.date)
                      let options = {weekday: 'long'}
                      let dayName = date.toLocaleDateString('en-US', options)
                      dayName = dayName.split(",")[0]

                      return (
                        <View className='flex justify-center items-center w-24 rounded-3xl py-3 space-y-1'
                          style={{backgroundColor: theme.bgWhite(0.15),}}
                          key={index}
                        >
                          <Image source={weatherImages[item?.day?.condition?.text]} className='w-11 h-11' />
                          <Text className='text-white'>{item.date}</Text>
                          <Text className='text-white'>{dayName}</Text>
                          <Text className='text-white text-xl font-semibold'>{item?.day?.avgtemp_c}&#176;</Text>
                        </View>
                      )
                    })
                  }
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        )
      }

    </View>
  )
}

export default Home