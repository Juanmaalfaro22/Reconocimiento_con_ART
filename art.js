//*------------------------------ GLOBALES -------------------------------------
const gama = 0.5; //gama
const columnas = 36; //Numero de neuronas
let pv = -1; //Parametro de vigilancia
let v = []; //V
let w = []; //W
 //Arreglo para guardar el valor calculado de las neuronas de salida en competencia
let nss = new Array();
let neuronasOcupadas = []; //Arreglo para guardar las neuronas ocupadas
let neuronasActuales = 2; //Numero de neuronas acutales
let patronSalida = []; //Arreglo para guardar la salida
let rs; //Relacion de semejanza
//Arreglo para guardar las neuronas que son descartadas
let neuronas_apagadas = [];
let num_patrones = 1; //Numero de entradas realizadas (debug)
let busquedas = 0;

//----------------------------------- EVENTOS ----------------------------------
let btn = document.getElementById('btn');
btn.addEventListener('click',mostrarPatron); //Boton Mostrar
let btn2 = document.getElementById('btn2');
btn2.addEventListener('click',limpiar); // Boton Limpiar

//----------------------------------- BANDERAS ---------------------------------
let primeraVez = true;
let terminado = false;
//*------------------------------ INICIALIZACION -------------------------------
function artInit(){
    //Se agregan dos renglones de 1's a V, son las neuronas de salida iniciales
    v.push(new Array(36).fill(1));
    v.push(new Array(36).fill(1));

    //Se calcula el peso inicial para W
    let peso = 1/(1+columnas);
    //Se agregan
    for(let i=0;i<columnas;i++)
        w.push(new Array(2).fill(peso));
    nss.push(0);
    nss.push(0);
}

//--------------------------- OBTENCION DE DATOS -------------------------------
function getPV(){
    let input = document.getElementById('in').value;
    pv = input;
}

function getPatron(){
    let array = [];
    let cuadros = document.getElementsByClassName('cuadro');
    for(let i=0;i<cuadros.length;i++){
        if(estaColoreado( cuadros[i].getAttribute('id') ))
            array.push(1);
        else
            array.push(0);
    }
    return array;
}

//*-------------------------- FUNCIONES PARA ART -------------------------------
function ejecutarART(){
    if (primeraVez){//Si es la primera vez, se inicializan las variables
        artInit();
    }
    console.log("Entrada "+num_patrones+"\n");//Num de entrada (debug)
    terminado = false;
    ini_neuronas = 0;
    busquedas = 0;
    neuronas_apagadas = [];
    while(!terminado){
        let n_ganadora = competencia(getPatron()) //Compiten las neuronas
        //Se envia la neurona ganadora para aprender y responder o solo responder
        aprender_responder(n_ganadora);
        console.log("No. busq: "+busquedas)
        busquedas++;
    }
    console.log("Neuronas apagadas: ");
    console.log(neuronas_apagadas);
    //console.log(w); //Se muestra w (debug)
    //console.log(v); //Se muestra w (debug)
    console.log("\n"); //(debug)
    num_patrones++; //Se incrementa el numero de entradas (debug)
    gridClases();//Se muestran las clases aprendidas
    //Se muestra la relacion de semejanza
    document.getElementById("rs").innerHTML = "Relación de semejanza: "+rs;
}

function competencia(patron){
    //Variable para guardar el resultado del calculo
    let ns = 0;
    //Variable para almacenar el indice de la nerurona ganadora
    let indice_ganadora = -1;
    //Copia del arreglo de neuronas de salida para trabajar sobre este
    let copia_nss = [];

    for(let h = 0; h < w[0].length ; h++){
        //Si la neurona no ha sido descartada
        if(!apagada(h)){
            for(let r =0; r<patron.length; r++){
                ns += w[r][h] * patron[r]; //Se multiplican los pesos por la entrada
            }
            copia_nss.push(ns);//Se guarda el resultado en la copia de nss
            //Se guarda el valor de la neurona calculada en el arreglo de neuronas
            //de salida
            nss[h] = ns;
            ns = 0; //Se reinicia la variable para el el valor de la siguiente neurona
        }
    }
    //Si el indice de neuronas de competencia ya alcanzo el numero de neuronas
    //actuales, se envia como ganadora la ultima clase conocida
    if(neuronas_apagadas.length >= neuronasActuales){
        indice_ganadora = w[0].length-1;
    }else{//Si no
        //Compiten las neuronas
        copia_nss.sort(); //Se ordena la copia del arreglo de las neuronas de salida
         //Se selecciona el ultimo valor (valor mas alto), la neurona ganadora
        let ganadora = copia_nss[copia_nss.length - 1]

        if (primeraVez){ //Si es la primera vez
            indice_ganadora = 0;//Se usa la primera neurona de salida
            neuronasOcupadas.push(0);//Se agrega el indice de la neurona ganadora
            //en el arreglo de neuronasOcupadas

        }else{//Si no
            for(let i = 0; i<nss.length; i++){
                //Se busca el indice de la neurona ganadora en el arreglo original
                //de neuronas de salida
                if(nss[i] == ganadora){
                    indice_ganadora = i; //Se guarda el indice
                    break; //Se termina
                }
            }
        }
    }

    return indice_ganadora;//Se devuelve el indice de la neurona ganadora
}

function aprender_responder(ganadora){
    //Se calcula la relacion de semejanza del patron con la neurona ganadora
    calcularRS(getPatron(), ganadora)

    console.log("Rs: "+rs); //(debug)
    console.log("Ganadora: "+ganadora);//(debug)
    console.log("PV: "+pv);//(debug)

    if(primeraVez){//Si es la primera vez, se aprende directamente
        //Se calculan los nuevos pesos en la columna correspondiente a la
        //neurona ganadora
        calcularPesos(getPatron(), ganadora);
        //Se aprende el patron realizando un AND entre la neurona ganadora de v
        //y el patron
        v[ganadora] = AND(ganadora);
        primeraVez = false;//Se indica que ya no es la primera vez
        terminado = true; //Se termina el proceso
    }

    if(rs >= pv ){//Si los patrones son muy parecidos, rs mayor a pv
        //Regresa el patron de la clase a la que pertenece la neurona ganadora
        patronSalida = v[ganadora];
        //patronSalida =AND(ganadora);
        //Se muestra la clase que gano, a la que mas se parece el patron
        document.getElementById("winner").innerHTML = "Clase ganadora: "+ganadora;
        terminado = true; //Se termina el proceso

    }else{//Si no
        //Se revisa si quedan clases conocidas para comprobar
        if(neuronasOcupadas.length > neuronas_apagadas.length){//Si es asi
            //Se incrementa ini_neuronas para descartar la clase con la que no hubo
            //coincidencia y usar las restantes para seguir buscando.
            neuronas_apagadas.push(ganadora);
            console.log("Neurona apagada: "+ganadora);
        }else{//Si ya no quedan clases conocidas
            //Se revisa si hay espacio en V para aprender el patron
            if(neuronasOcupadas.length < neuronasActuales){//Si lo hay
                //Se muestra la neurona que gano la competencia y se notifica que se
                //creó una nueva clase.
                document.getElementById("winner").innerHTML = "Ganadora: "+ganadora+".  Nueva clase";
                let n_desocupada = -1; //Variable para almacenar la neurona desocupada
                //Se toma la neurona desocupada para aprender el nuevo patron
                n_desocupada = neuronasOcupadas.length;
                //Se inserta el indice de la neurona ocupada en el arreglo
                neuronasOcupadas.push(n_desocupada);
                //Calcular los pesos para el patron nuevo
                calcularPesos(getPatron(),n_desocupada);
                v[n_desocupada] = getPatron();//Aprende el patron nuevo
                //v[n_desocupada] = AND(ganadora);
                //Devuelve el patron aprendido
                patronSalida = v[n_desocupada];
                terminado = true; //Se termina el proceso
            }else{//Si no hay neuronas disponibles
                //Se muestra la neurona que gano la competencia y se notifica que se
                //creó una nueva clase.
                document.getElementById("winner").innerHTML = "Ganadora: "+ganadora+".  Nueva clase";
                //Se agrega un renglon a v, una columna a w y un espacio a nss
                agregarNeuronas();
                //Se calculan los pesos para el nuevo patron
                calcularPesos(getPatron(), w[0].length-1);
                v[v.length-1] = getPatron(); //Se aprende el nuevo patron
                //v[v.length-1] = AND(ganadora);
                //Se devuelve el patron aprendido
                patronSalida = v[v.length-1];
                terminado = true; //Se termina el proceso
            }
        }
    }
}

function calcularRS(patron, indice){
  //Se recibe el patron y el indice para el renglon de v con el que se haran
  //los calculos
    let mult = 0;
    for(let i=0;i<patron.length;i++)
        //Se multiplica la neurona ganadora por el patron ||E x V||
        mult += (v[indice][i] * patron[i]);

    if(usarEntrada(indice) || primeraVez){//Si es asi o es la primera vez
        //Se utiliza el patron para calcular el divisor (denominador) de la formula
        rs = mult/patron.reduce((a, b) => a + b, 0);//Se hace el calculo de la formula
    }else{//Si no es asi
        //Se utiliza la neurona ganadora para calcular el divisor (denominador)
        //de la formula
        rs = mult/v[indice].reduce((a, b) => a + b, 0); //Se hace el calculo de la formula
    }
}

function calcularPesos(patron, indice){
    //Se recibe el patron y el indice de la columna de w que sera modificada
    let suma = 0;
    for(let c=0;c<patron.length;c++){
        //Se hace la sumatoria de las multiplicaciones de v por el patron
        suma += v[indice][c] * patron[c];
    }

    suma += gama;//Se le agrega gamma a la sumatoria

    for(let c=0;c<patron.length;c++)
        //Se realiza el ultimo calculo de la formula y se almacena en la columna
        //de w correspondiente
        w[c][indice] = (v[indice][c]*patron[c])/suma;
}

function agregarNeuronas(){
    //Se agrega un nuevo renglon de 1's a V para almacenar un nuevo patron (clase)
    v.push( new Array (36).fill(1) );

    //Se agrega una columna de -1's a W para almacenar los pesos de un nuevo patron
    for(let i=0; i<w.length;i++)
        w[i].push(-1);

    //Se agrega un -1 al arreglo de valores de neuronas de salida para alamcenar
    //el valor de la neurona de salida del nuevo patron
    nss.push(-1);
    //Se agrega un espacio mas al arreglo de neuronas ocupadas para alamcenar
    //el indice del nuevo patron
    neuronasOcupadas.push(-1);
    //Se incrementa la cantidad actual de neuronas de salida
    neuronasActuales++;
}

function AND(indice){
    //Se recibe el indice del renglon de V con el que se va a hacer el AND
    let clase = []; //Se crea una lista para guardar el resultado
    let patron = getPatron(); //Se obtiene el patron
        for(let i=0; i<v[0].length; i++){
            //Se realiza un AND entre v[indice] y el patron
            clase.push(v[indice][i]&patron[i]);
        }

    return clase;//Se regresa el resultado
}

function usarEntrada(indice){
    //Se recibe el indice del renglon de V con el que se va a trabajar
    let patron = getPatron(); //Se toma el patron
    let num_neuronas_v = 0;//Variables para almacenar el numero de neuronas activas
    let num_neuronas_p = 0;
    for(let i=0; i<v[0].length; i++){
        //Se cuenta las neuronas activas (1's) de v[indice] y el patron
        if(v[indice][i] == 1)
            num_neuronas_v++;
        if(patron[i] == 1)
            num_neuronas_p++;
    }
    //Si el patron tiene mas o el mismo numero de neuronas activas que v[indice]
    if(num_neuronas_p >= num_neuronas_v)
      return true;//Se envia true, indicando que se va a usar el patron de entrada
    else//Si no
      return false;//Se envia false, indicando que se va a usar v[indice]
}

function apagada(indice){
    //Si hay alguna neurona descartada
    if(neuronas_apagadas.length > 0){
        for (let i=0; i<neuronas_apagadas.length; i++){
            //Se revisa si coincide con el indice recibido
            if(neuronas_apagadas[i] == indice)
              return true;//Si es asi, se devuelve un true indicando que no se
              //debe tomar en cuenta
        }
    }//Si no hay neuronas descartadas o no se encontro coincidencia con el indice
    //se devuelve un falso indicando que se debe tomar en cuenta la neurona
    return false;
}

//*------------------------------ VISUALIZACION --------------------------------
function estaColoreado(id){
    //Se toma el cuadro por su ID
    let cuadro = document.getElementById(id);
    if(cuadro.classList.contains('colorear'))//Si tiene la clase 'colorear'
        return true; //Se regresa true
    return false;//si no false
}

function cambiarColor(id){
   //Se toma el cuadro
    let cuadro = document.getElementById(id);
    if(estaColoreado(id)) //Si esta coloreado
        cuadro.classList.remove('colorear');//Se despinta
    else//SI no
        cuadro.classList.add('colorear');//Se pinta
}

function limpiar(){
    //Se toman los cuadros que esten pintados de ambas cuadriculas
    let cuadro = document.getElementsByClassName('cuadro');
    let cuadroS = document.getElementsByClassName('cuadroS');
    for(let i=0; i<cuadroS.length;i++){
        //Se elimina la clase 'colorear' de los cuadros para despintarlos
        cuadro[i].classList.remove('colorear');
        //cuadroS[i].classList.remove('colorear');
    }
}

function limpiarSalida(){
    //Se toman los cuadros que esten pintados de la salida
    let cuadroS = document.getElementsByClassName('cuadroS');
    for(let i=0; i<cuadroS.length;i++){
        //Se elimina la clase 'colorear' de los cuadros para despintarlos
        cuadroS[i].classList.remove('colorear');
    }
}

function mostrarPatron(){
    limpiarSalida(); //Se limpian las cuadriculas
    getPV(); //Se toma el parametro de vigilancia
    ejecutarART(); //Se ejecuta art
    //Se toman los cuadros de la salida
    let cuadro = document.getElementsByClassName('cuadroS');
    for(let i=0;i<patronSalida.length;i++){
        //Si el indice i del patron de salida es 1, se pinta el cuadro de indice
        //i
        if(patronSalida[i] == 1){
            cuadro[i].classList.add('colorear');
        }
    }
}

function gridClases(){
    //Se elimina y crea el div de las clases para reiniciarlo
    cont = document.getElementById("clases")
    cont.remove();//Se elimina
    container = document.createElement("div"); //Se vuelve a crear
    container.id = "clases";//Se asigna el id
    container.className = "classes-container";//Se asigna la clase

    //Se toma el contenedor principal para agregarle el div de las clases nuevo
    main = document.getElementById("main");
    main.appendChild(container);

    //Por cada neurona ocupada (patron aprendido)
    for(let c=0; c < neuronasOcupadas.length; c++){
        //Se crea un div para el numero de clase y su patron
        let clase = document.createElement("div");
        clase.className = "clases";
        //Se crea un contenedor para el numero de la clase
        let c_clase = document.createElement("div");
        let n_clase = document.createElement("p");
        n_clase.innerHTML = "Clase "+c; //Se asigna el numero de clase
        //Se agrega el nombre de la clase a su contenedor
        c_clase.appendChild(n_clase);
        //Se agrega el contenedor con el nombre de la clase al contenedor de la
        //clase
        clase.appendChild(c_clase);

        //Se crea una cuadricula para mostrar el patron de la clase
        let grid = document.createElement("div");
        grid.className = "cuadricula-clases"; //Se asigna su clase
        grid.id = "clase"+c;//Se asigna su id

        for(let i=0; i<36; i++){
            let cuadro = document.createElement("div");//Se crea el cuadro
            cuadro.className = "cuadroC";//Se le asigna su clase
            cuadro.id = "c"+c+"n"+i;//Se asigna su id
            grid.appendChild(cuadro);//Se inserta en la cuadricula
        }
        //Se inserta la cuadricula en el contenedor de su clase
        clase.appendChild(grid);
        //Se inserta el contenedor de la clase en el contenedor de clases
        container.appendChild(clase);
    }

    //Creadas las cuadriculas de las clases, se pintan los cuadros para mostrar
    //su patron
    for(let i=0; i<neuronasOcupadas.length; i++){
        for(let c=0; c<v[0].length; c++){
            if(v[i][c] == 1){
              cuadro = document.getElementById("c"+i+"n"+c);
              cuadro.classList.add("colorear");
            }
        }
    }
}
